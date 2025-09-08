import { AppDataSource } from '../src/ormconfig';
import { ZealyQuestEntity } from '../src/database/entities/zealy-quest.entity';

async function checkZealySeeds() {
  try {
    await AppDataSource.initialize();
    
    const repository = AppDataSource.getRepository(ZealyQuestEntity);
    const quests = await repository.find();
    
    console.log('=== Zealy Quests in Database ===');
    if (quests.length === 0) {
      console.log('No Zealy quests found in database');
    } else {
      quests.forEach((quest, index) => {
        console.log(`\n${index + 1}. ${quest.name}`);
        console.log(`   ID: ${quest.id}`);
        console.log(`   Zealy ID: ${quest.zealyQuestId}`);
        console.log(`   Type: ${quest.type === 0 ? 'REFERRAL_CHECK' : 'TRADE_CHECK'}`);
        console.log(`   Category: ${quest.category === 0 ? 'ONE_TIME' : quest.category === 1 ? 'DAILY' : 'MULTI_TIME'}`);
        console.log(`   Status: ${quest.status === 1 ? 'ACTIVE' : 'INACTIVE'}`);
        console.log(`   Requirements:`, JSON.stringify(quest.requirements, null, 2));
      });
    }
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error checking Zealy seeds:', error.message);
    process.exit(1);
  }
}

checkZealySeeds();