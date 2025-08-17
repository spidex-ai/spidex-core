import { BaseRepository } from '@database/common/base.repository';
import { EventRankPrizeEntity } from '@database/entities/event-rank-prize.entity';
import { EntityRepository } from 'nestjs-typeorm-custom-repository';
import { IsNull } from 'typeorm';

@EntityRepository(EventRankPrizeEntity)
export class EventRankPrizeRepository extends BaseRepository<EventRankPrizeEntity> {
  async findPrizeByRank(eventId: number, rank: number): Promise<EventRankPrizeEntity | null> {
    return this.createQueryBuilder('prize')
      .where('prize.eventId = :eventId', { eventId })
      .andWhere('prize.rankFrom <= :rank', { rank })
      .andWhere('prize.rankTo >= :rank', { rank })
      .andWhere('prize.deletedAt IS NULL')
      .getOne();
  }

  async findPrizesByEvent(eventId: number): Promise<EventRankPrizeEntity[]> {
    return this.find({
      where: {
        eventId,
        deletedAt: IsNull()
      },
      order: {
        rankFrom: 'ASC'
      }
    });
  }

  async deletePrizesByEvent(eventId: number): Promise<void> {
    await this.update(
      { eventId },
      { deletedAt: new Date() }
    );
  }
}