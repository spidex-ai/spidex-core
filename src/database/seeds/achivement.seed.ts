import { AchievementEntity } from '@database/entities/achievement.entity';
import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import achievementData from '../data-seed/achievement.seed.json';
export default class AchievementSeeder implements Seeder {
    public async run(dataSource: DataSource): Promise<any> {
        const repository = dataSource.getRepository(AchievementEntity);
        await repository.insert(achievementData);
    }
}
