import { BaseRepository } from '@database/common/base.repository';
import { UserAchievementEntity } from '@database/entities/user-achievement.entity';
import { EntityRepository } from 'nestjs-typeorm-custom-repository';

@EntityRepository(UserAchievementEntity)
export class UserAchievementRepository extends BaseRepository<UserAchievementEntity> {
  async findUserAchievements(userId: number): Promise<UserAchievementEntity[]> {
    return this.createQueryBuilder('userAchievement')
      .leftJoinAndSelect('userAchievement.achievement', 'achievement')
      .where('userAchievement.userId = :userId', { userId })
      .orderBy('achievement.points', 'ASC')
      .getMany();
  }
}
