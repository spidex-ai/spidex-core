import { BaseRepository } from '@database/common/base.repository';
import { EventParticipantEntity } from '@database/entities/event-participant.entity';
import { EntityRepository } from 'nestjs-typeorm-custom-repository';
import { IsNull } from 'typeorm';

@EntityRepository(EventParticipantEntity)
export class EventParticipantRepository extends BaseRepository<EventParticipantEntity> {
  async findByEventAndUser(eventId: number, userId: number): Promise<EventParticipantEntity | null> {
    return this.findOne({
      where: {
        eventId,
        userId,
        deletedAt: IsNull(),
      },
      relations: ['user'],
    });
  }

  async updateParticipantTotals(participantId: number): Promise<void> {
    const updateQuery = `
      UPDATE event_participants 
      SET 
        total_volume = (
          SELECT COALESCE(SUM(et.volume_usd), 0)
          FROM event_trades et
          WHERE et.participant_id = $1 AND et.deleted_at IS NULL
        ),
        trade_count = (
          SELECT COALESCE(COUNT(*), 0)
          FROM event_trades et
          WHERE et.participant_id = $1 AND et.deleted_at IS NULL
        ),
        last_trade_at = (
          SELECT MAX(et.recorded_at)
          FROM event_trades et
          WHERE et.participant_id = $1 AND et.deleted_at IS NULL
        ),
        updated_at = NOW()
      WHERE id = $1
    `;

    await this.query(updateQuery, [participantId]);
  }

  async getEventParticipants(
    eventId: number,
    limit: number = 100,
    offset: number = 0,
  ): Promise<EventParticipantEntity[]> {
    return this.find({
      where: {
        eventId,
        deletedAt: IsNull(),
      },
      relations: ['user'],
      order: {
        totalVolume: 'DESC',
      },
      take: limit,
      skip: offset,
    });
  }

  async getParticipantRank(eventId: number, userId: number): Promise<number | null> {
    const rankQuery = `
      SELECT rank_result.rank
      FROM (
        SELECT 
          user_id,
          RANK() OVER (ORDER BY total_volume DESC) as rank
        FROM event_participants
        WHERE event_id = $1 
          AND deleted_at IS NULL
          AND total_volume > 0
      ) rank_result
      WHERE rank_result.user_id = $2
    `;

    const result = await this.query(rankQuery, [eventId, userId]);
    return result.length > 0 ? parseInt(result[0].rank) : null;
  }

  async getUnclaimedPrizeParticipants(eventId: number): Promise<EventParticipantEntity[]> {
    return this.find({
      where: {
        eventId,
        prizeClaimed: false,
        deletedAt: IsNull(),
      },
      order: {
        rank: 'ASC',
      },
    });
  }

  async getBatchParticipantCounts(eventIds: number[]): Promise<Map<number, number>> {
    if (eventIds.length === 0) return new Map();

    const countQuery = `
      SELECT 
        event_id,
        COUNT(*) as participant_count
      FROM event_participants
      WHERE event_id = ANY($1) AND deleted_at IS NULL
      GROUP BY event_id
    `;

    const results = await this.query(countQuery, [eventIds]);
    const countMap = new Map<number, number>();

    results.forEach((row: any) => {
      countMap.set(parseInt(row.event_id), parseInt(row.participant_count));
    });

    // Set 0 for events with no participants
    eventIds.forEach(eventId => {
      if (!countMap.has(eventId)) {
        countMap.set(eventId, 0);
      }
    });

    return countMap;
  }
}
