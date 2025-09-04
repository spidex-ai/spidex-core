import { BaseRepository } from '@database/common/base.repository';
import { ALL_DEX, ALL_TOKEN, EEventStatus, EventEntity } from '@database/entities/event.entity';
import { EventFilterStatus } from '@modules/event/dtos/event-request.dto';
import { EntityRepository } from 'nestjs-typeorm-custom-repository';
import { In, IsNull, LessThan } from 'typeorm';

export interface EventLeaderboardEntry {
  user_id: number;
  total_volume: string;
  trade_count: number;
  rank: number;
  wallet_address?: string;
  username?: string;
  avatar?: string;
}

export interface EventAnalytics {
  totalParticipants: number;
  totalVolumeTraded: string;
  totalTrades: number;
  averageVolumePerParticipant: string;
  topTraders: EventLeaderboardEntry[];
  dailyVolumeChart: Array<{ date: string; volume: string }>;
  tokenDistribution: Array<{ token: string; volume: string; percentage: number }>;
}

@EntityRepository(EventEntity)
export class EventRepository extends BaseRepository<EventEntity> {
  async getActiveEventsForTokenAndDex(
    tokenA: string,
    tokenB: string,
    dex: string,
    tradingTime: Date,
  ): Promise<EventEntity[]> {
    const result = await this.createQueryBuilder('event')
      .where('event.status = :status', { status: EEventStatus.ACTIVE })
      .andWhere('event.start_date <= :tradingTime', { tradingTime })
      .andWhere('event.end_date >= :tradingTime', { tradingTime })
      .andWhere('(event.trade_token = :tokenA OR event.trade_token = :tokenB OR event.trade_token = :allToken)', {
        tokenA: tokenA,
        tokenB: tokenB,
        allToken: ALL_TOKEN,
      })
      .andWhere('(event.trade_dex = :tradeDex OR event.trade_dex = :allDex)', {
        tradeDex: dex,
        allDex: ALL_DEX,
      })
      .andWhere('event.deleted_at IS NULL')
      .getMany();

    return result;
  }

  async getEventsWithFilter(filter?: { status?: EventFilterStatus }): Promise<EventEntity[]> {
    const query = this.createQueryBuilder('event').where('event.deleted_at IS NULL');
    const now = new Date();
    if (filter?.status) {
      switch (filter.status) {
        case EventFilterStatus.UPCOMING:
          query
            .andWhere('event.start_date > :now', { now })
            .andWhere('event.status = :status', { status: EEventStatus.ACTIVE });
          break;
        case EventFilterStatus.LIVE:
          query
            .andWhere('event.start_date <= :now AND event.end_date >= :now', { now })
            .andWhere('event.status = :status', { status: EEventStatus.ACTIVE });
          break;
        case EventFilterStatus.ENDED:
          query.andWhere('event.end_date < :now', { now }).andWhere('event.status IN (:...statuses)', {
            statuses: [EEventStatus.ACTIVE, EEventStatus.ENDED],
          });
          break;
        case EventFilterStatus.DISTRIBUTED:
          query.andWhere('event.status = :status', { status: EEventStatus.PRIZES_DISTRIBUTED });
          break;
      }
    } else {
      query.andWhere('event.status = :status', { status: EEventStatus.ACTIVE });
    }

    query.orderBy('event.created_at', 'DESC');

    return query.getMany();
  }

  async getEventLeaderboard(
    eventId: number,
    limit: number = 100,
    offset: number = 0,
  ): Promise<EventLeaderboardEntry[]> {
    const query = `
      SELECT 
        ep.user_id,
        ep.total_volume,
        ep.trade_count,
        RANK() OVER (ORDER BY ep.total_volume DESC) as rank,
        u.wallet_address,
        u.username,
        u.avatar
      FROM event_participants ep
      LEFT JOIN users u ON u.id = ep.user_id
      WHERE ep.event_id = $1
        AND ep.total_volume > 0
        AND ep.deleted_at IS NULL
      ORDER BY ep.total_volume DESC
      LIMIT $2 OFFSET $3
    `;

    return this.query(query, [eventId, limit, offset]);
  }

  async updateParticipantRank(eventId: number): Promise<void> {
    const updateRankQuery = `
      UPDATE event_participants 
      SET rank = ranked_participants.new_rank,
          updated_at = NOW()
      FROM (
        SELECT 
          id,
          RANK() OVER (ORDER BY total_volume DESC) as new_rank
        FROM event_participants 
        WHERE event_id = $1 
          AND deleted_at IS NULL
          AND total_volume > 0
      ) ranked_participants
      WHERE event_participants.id = ranked_participants.id
        AND event_participants.event_id = $1
    `;

    await this.query(updateRankQuery, [eventId]);
  }

  async getEventAnalytics(eventId: number): Promise<EventAnalytics> {
    // Get basic statistics
    const basicStatsQuery = `
      SELECT 
        COUNT(*) as total_participants,
        COALESCE(SUM(ep.total_volume), 0) as total_volume_traded,
        COALESCE(SUM(ep.trade_count), 0) as total_trades,
        COALESCE(AVG(ep.total_volume), 0) as average_volume_per_participant
      FROM event_participants ep
      WHERE ep.event_id = $1
        AND ep.deleted_at IS NULL
    `;

    const [basicStats] = await this.query(basicStatsQuery, [eventId]);

    // Get top 10 traders
    const topTraders = await this.getEventLeaderboard(eventId, 10);

    // Get daily volume chart
    const dailyVolumeQuery = `
      SELECT 
        DATE(et.recorded_at) as date,
        SUM(et.volume_usd) as volume
      FROM event_trades et
      WHERE et.event_id = $1
        AND et.deleted_at IS NULL
      GROUP BY DATE(et.recorded_at)
      ORDER BY date ASC
    `;

    const dailyVolumeChart = await this.query(dailyVolumeQuery, [eventId]);

    // Get token distribution
    const tokenDistributionQuery = `
      SELECT 
        et.token_traded as token,
        SUM(et.volume_usd) as volume
      FROM event_trades et
      WHERE et.event_id = $1
        AND et.deleted_at IS NULL
      GROUP BY et.token_traded
      ORDER BY volume DESC
    `;

    const tokenDistributionRaw = await this.query(tokenDistributionQuery, [eventId]);
    const totalVolume = parseFloat(basicStats.total_volume_traded);

    const tokenDistribution = tokenDistributionRaw.map((item: any) => ({
      token: item.token,
      volume: item.volume,
      percentage: totalVolume > 0 ? (parseFloat(item.volume) / totalVolume) * 100 : 0,
    }));

    return {
      totalParticipants: parseInt(basicStats.total_participants),
      totalVolumeTraded: basicStats.total_volume_traded,
      totalTrades: parseInt(basicStats.total_trades),
      averageVolumePerParticipant: basicStats.average_volume_per_participant,
      topTraders,
      dailyVolumeChart: dailyVolumeChart.map((item: any) => ({
        date: item.date,
        volume: item.volume,
      })),
      tokenDistribution,
    };
  }

  async findEventsToComplete(): Promise<EventEntity[]> {
    const now = new Date();

    return this.find({
      where: {
        endDate: LessThan(now),
        status: EEventStatus.ACTIVE,
        deletedAt: IsNull(),
      },
      relations: ['rankPrizes'],
    });
  }

  async getActiveEvents(): Promise<EventEntity[]> {
    return this.find({
      where: {
        status: EEventStatus.ACTIVE,
        deletedAt: IsNull(),
      },
      order: {
        startDate: 'DESC',
      },
    });
  }
}
