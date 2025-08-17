import { QuestEntity } from '@database/entities/quest.entity';
import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import questData from '../data-seed/quest.seed.json';
export default class QuestSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<any> {
    const repository = dataSource.getRepository(QuestEntity);
    const quest = await repository.findOne({ where: { id: 1 } });
    if (quest) {
      return;
    }
    await repository.insert(questData);
  }
}
