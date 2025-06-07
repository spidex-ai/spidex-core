import { BaseRepository } from '@database/common/base.repository';
import { AchievementEntity } from '@database/entities/achievement.entity';
import { EntityRepository } from 'nestjs-typeorm-custom-repository';

@EntityRepository(AchievementEntity)
export class AchievementRepository extends BaseRepository<AchievementEntity> {
  async findNextAchievement(userPoints: number): Promise<AchievementEntity> {
    return this.createQueryBuilder('achievement')
      .where('achievement.points > :userPoints', { userPoints })
      .andWhere('achievement.status = :status', { status: 1 })
      .orderBy('achievement.points', 'ASC')
      .getOne();
  }

  async findUnlockedAchievements(userPoints: number): Promise<AchievementEntity[]> {
    return this.createQueryBuilder('achievement')
      .where('achievement.points <= :userPoints', { userPoints })
      .andWhere('achievement.status = :status', { status: 1 })
      .orderBy('achievement.points', 'DESC')
      .getMany();
  }
}
