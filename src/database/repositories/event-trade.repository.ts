import { BaseRepository } from '@database/common/base.repository';
import { EventTradeEntity } from '@database/entities/event-trade.entity';
import { EntityRepository } from 'nestjs-typeorm-custom-repository';
import { IsNull } from 'typeorm';

@EntityRepository(EventTradeEntity)
export class EventTradeRepository extends BaseRepository<EventTradeEntity> {
  async findTradesByParticipant(
    participantId: number,
    limit: number = 100,
    offset: number = 0,
  ): Promise<EventTradeEntity[]> {
    return this.find({
      where: {
        participantId,
        deletedAt: IsNull(),
      },
      relations: ['swapTransaction'],
      order: {
        recordedAt: 'DESC',
      },
      take: limit,
      skip: offset,
    });
  }

  async findTradesByEvent(eventId: number, limit: number = 100, offset: number = 0): Promise<EventTradeEntity[]> {
    return this.find({
      where: {
        eventId,
        deletedAt: IsNull(),
      },
      relations: ['participant', 'swapTransaction'],
      order: {
        recordedAt: 'DESC',
      },
      take: limit,
      skip: offset,
    });
  }

  async getParticipantVolumeByToken(participantId: number, tokenId: string): Promise<string> {
    const result = await this.createQueryBuilder('trade')
      .select('COALESCE(SUM(trade.volumeUsd), 0)', 'totalVolume')
      .where('trade.participantId = :participantId', { participantId })
      .andWhere('trade.tokenTraded = :tokenId', { tokenId })
      .andWhere('trade.deletedAt IS NULL')
      .getRawOne();

    return result.totalVolume || '0';
  }

  async checkDuplicateTrade(swapTransactionId: number, eventId: number): Promise<boolean> {
    const count = await this.count({
      where: {
        swapTransactionId,
        eventId,
        deletedAt: IsNull(),
      },
    });

    return count > 0;
  }

  async getEventVolumeStats(eventId: number): Promise<{
    totalVolume: string;
    totalTrades: number;
    uniqueTokens: number;
  }> {
    const volumeQuery = `
      SELECT 
        COALESCE(SUM(volume_usd), 0) as total_volume,
        COUNT(*) as total_trades,
        COUNT(DISTINCT token_traded) as unique_tokens
      FROM event_trades
      WHERE event_id = $1 AND deleted_at IS NULL
    `;

    const [result] = await this.query(volumeQuery, [eventId]);

    return {
      totalVolume: result.total_volume || '0',
      totalTrades: parseInt(result.total_trades) || 0,
      uniqueTokens: parseInt(result.unique_tokens) || 0,
    };
  }

  async getBatchEventVolumeStats(eventIds: number[]): Promise<
    Map<
      number,
      {
        totalVolume: string;
        totalTrades: number;
        uniqueTokens: number;
      }
    >
  > {
    if (eventIds.length === 0) return new Map();

    const volumeQuery = `
      SELECT 
        event_id,
        COALESCE(SUM(volume_usd), 0) as total_volume,
        COUNT(*) as total_trades,
        COUNT(DISTINCT token_traded) as unique_tokens
      FROM event_trades
      WHERE event_id = ANY($1) AND deleted_at IS NULL
      GROUP BY event_id
    `;

    const results = await this.query(volumeQuery, [eventIds]);
    const statsMap = new Map<
      number,
      {
        totalVolume: string;
        totalTrades: number;
        uniqueTokens: number;
      }
    >();

    results.forEach((row: any) => {
      statsMap.set(parseInt(row.event_id), {
        totalVolume: row.total_volume || '0',
        totalTrades: parseInt(row.total_trades) || 0,
        uniqueTokens: parseInt(row.unique_tokens) || 0,
      });
    });

    // Set default stats for events with no trades
    eventIds.forEach(eventId => {
      if (!statsMap.has(eventId)) {
        statsMap.set(eventId, {
          totalVolume: '0',
          totalTrades: 0,
          uniqueTokens: 0,
        });
      }
    });

    return statsMap;
  }
}
