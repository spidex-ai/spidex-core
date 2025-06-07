import { AchievementEntity } from '@database/entities/achievement.entity';
import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import achievementData from '../data-seed/achievement.seed.json';
export default class AchievementSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<any> {
    for (const achievement of achievementData) {
      achievement.icon = `${process.env.APP_BASE_URL}${achievement.icon}`;
    }
    const repository = dataSource.getRepository(AchievementEntity);
    await repository.save(achievementData);
  }
}
