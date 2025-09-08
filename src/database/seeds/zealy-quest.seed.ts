import { ZealyQuestEntity } from '@database/entities/zealy-quest.entity';
import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import zealyQuestData from '../data-seed/zealy-quest.seed.json';

export default class ZealyQuestSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<any> {
    const repository = dataSource.getRepository(ZealyQuestEntity);
    
    // Check if any Zealy quests already exist
    const existingQuest = await repository.findOne({ 
      where: { zealyQuestId: zealyQuestData[0].zealyQuestId } 
    });
    
    if (existingQuest) {
      console.log('Zealy quests already seeded, skipping...');
      return;
    }
    
    console.log('Seeding Zealy quests...');
    await repository.insert(zealyQuestData);
    console.log(`Seeded ${zealyQuestData.length} Zealy quests successfully`);
  }
}