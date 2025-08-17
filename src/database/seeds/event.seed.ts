import { EventEntity } from '@database/entities/event.entity';
import { EventRankPrizeEntity } from '@database/entities/event-rank-prize.entity';
import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import eventData from '../data-seed/event.seed.json';
import eventRankPrizeData from '../data-seed/event-rank-prize.seed.json';

export default class EventSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<any> {
    const eventRepository = dataSource.getRepository(EventEntity);
    const rankPrizeRepository = dataSource.getRepository(EventRankPrizeEntity);

    // Check if events already exist
    const existingEvent = await eventRepository.findOne({ where: { id: 1 } });
    if (existingEvent) {
      console.log('Events already seeded, skipping...');
      return;
    }

    console.log('Seeding events...');
    
    try {
      // Insert events
      await eventRepository.insert(eventData as any);
      console.log(`Successfully inserted ${eventData.length} events`);

      // Insert event rank prizes
      await rankPrizeRepository.insert(eventRankPrizeData);
      console.log(`Successfully inserted ${eventRankPrizeData.length} event rank prizes`);

      console.log('Event seeding completed successfully!');
      
      // Log summary
      console.log('\n=== EVENT SEEDING SUMMARY ===');
      console.log(`🎯 Total Events: ${eventData.length}`);
      console.log(`🏆 Total Prize Configurations: ${eventRankPrizeData.length}`);
      console.log(`💰 Total Prize Pool: $${eventData.reduce((sum, event) => sum + parseFloat(event.totalPrize), 0).toLocaleString()}`);
      
      const activeEvents = eventData.filter(event => event.status === 'ACTIVE').length;
      const draftEvents = eventData.filter(event => event.status === 'DRAFT').length;
      
      console.log(`📊 Active Events: ${activeEvents}`);
      console.log(`📋 Draft Events: ${draftEvents}`);
      console.log('=============================\n');

    } catch (error) {
      console.error('Error seeding events:', error);
      throw error;
    }
  }
}