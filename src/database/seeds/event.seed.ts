import { EventEntity } from '@database/entities/event.entity';
import { EventRankPrizeEntity } from '@database/entities/event-rank-prize.entity';
import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { randomUUID } from 'crypto';
import eventData from '../data-seed/event.seed.json';
import eventRankPrizeData from '../data-seed/event-rank-prize.seed.json';
import {
  EventSeedData,
  EventRankPrizeSeedData,
  EventPrizeMap,
  SeederSummary,
  validateEventSeedData,
  validateEventRankPrizeSeedData,
} from './types/event-seed.types';

export default class EventSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    console.log('🎯 Starting Event Seeder...');

    const eventRepository = dataSource.getRepository(EventEntity);
    const rankPrizeRepository = dataSource.getRepository(EventRankPrizeEntity);

    try {
      // Validate seed data with proper typing
      const validatedEvents: EventSeedData[] = validateEventSeedData(eventData as any[]);
      const validatedPrizes: EventRankPrizeSeedData[] = validateEventRankPrizeSeedData(eventRankPrizeData as any[]);

      console.log(`✅ Validated ${validatedEvents.length} events and ${validatedPrizes.length} prize configurations`);

      // Create prize mapping by event position (since eventId will be auto-generated)
      const prizesByEventIndex: EventPrizeMap = this.createPrizeMapping(validatedPrizes);

      let processedEvents = 0;
      let processedPrizes = 0;

      for (let i = 0; i < validatedEvents.length; i++) {
        const eventSeedData = validatedEvents[i];

        // Check if event already exists
        let existingEvent = eventSeedData.eventHash
          ? await eventRepository.findOne({ where: { eventHash: eventSeedData.eventHash } })
          : null;

        if (!existingEvent) {
          // Create new event with proper type conversion
          const newEvent = eventRepository.create({
            name: eventSeedData.name,
            description: eventSeedData.description,
            totalPrize: eventSeedData.totalPrize,
            startDate: new Date(eventSeedData.startDate),
            endDate: new Date(eventSeedData.endDate),
            status: eventSeedData.status as any,
            type: eventSeedData.type as any,
            tradeToken: eventSeedData.tradeToken,
            tradeDex: eventSeedData.tradeDex as any,
            icon: eventSeedData.icon,
            banner: eventSeedData.banner,
            url: eventSeedData.url,
            eventHash: eventSeedData.eventHash || this.generateEventHash(),
            customData: eventSeedData.customData || [],
            estimateDistributionDate: eventSeedData.estimateDistributionDate
              ? new Date(eventSeedData.estimateDistributionDate)
              : null,
            distributionDate: eventSeedData.distributionDate ? new Date(eventSeedData.distributionDate) : null,
            createdBy: eventSeedData.createdBy,
          });

          existingEvent = (await eventRepository.save(newEvent));
          processedEvents++;
          console.log(`✅ Created event: "${existingEvent.name}" (ID: ${existingEvent.id})`);
        } else {
          console.log(`⏭️  Event already exists: "${existingEvent.name}" (ID: ${existingEvent.id})`);
        }

        // Process prizes for this event
        const eventPrizes = prizesByEventIndex[existingEvent.eventHash]; // eventId is 1-based in seed data
        if (eventPrizes && eventPrizes.length > 0) {
          for (const prizeSeedData of eventPrizes) {
            const existingPrize = await rankPrizeRepository.findOne({
              where: {
                eventId: existingEvent.id,
                rankFrom: prizeSeedData.rankFrom,
                rankTo: prizeSeedData.rankTo,
              },
            });

            if (!existingPrize) {
              await rankPrizeRepository.insert({
                eventId: existingEvent.id,
                rankFrom: prizeSeedData.rankFrom,
                rankTo: prizeSeedData.rankTo,
                prizePoints: prizeSeedData.prizePoints,
                prizeToken: prizeSeedData.prizeToken,
                prizeTokenAmount: prizeSeedData.prizeTokenAmount,
                description: prizeSeedData.description,
              });
              processedPrizes++;
            }
          }
          console.log(`   🏆 Processed ${eventPrizes.length} prize configurations`);
        }
      }

      // Generate and display summary
      const summary: SeederSummary = await this.generateSummary(validatedEvents, processedPrizes);
      this.displaySummary(summary, processedEvents, processedPrizes);
    } catch (error) {
      console.error('❌ Error seeding events:', error);
      throw error;
    }
  }

  /**
   * Creates a mapping of prizes by event position/index
   */
  private createPrizeMapping(prizes: EventRankPrizeSeedData[]): EventPrizeMap {
    const mapping: EventPrizeMap = {};

    for (const prize of prizes) {
      if (!mapping[prize.eventHash]) {
        mapping[prize.eventHash] = [];
      }
      mapping[prize.eventHash].push(prize);
    }

    return mapping;
  }

  /**
   * Generates a unique event hash (UUID v4 format)
   */
  private generateEventHash(): string {
    // Generate a proper UUID v4 format
    return randomUUID();
  }

  /**
   * Generates seeder summary statistics
   */
  private async generateSummary(validatedEvents: EventSeedData[], processedPrizes: number): Promise<SeederSummary> {
    const totalPrizePool = validatedEvents.reduce((sum, event) => sum + parseFloat(event.totalPrize), 0);

    const activeEvents = validatedEvents.filter(event => event.status === 'ACTIVE').length;
    const draftEvents = validatedEvents.filter(event => event.status === 'DRAFT').length;
    const endedEvents = validatedEvents.filter(event => event.status === 'ENDED').length;
    const cancelledEvents = validatedEvents.filter(event => event.status === 'CANCELLED').length;

    return {
      totalEvents: validatedEvents.length,
      totalPrizeConfigurations: processedPrizes,
      totalPrizePool,
      activeEvents,
      draftEvents,
      endedEvents,
      cancelledEvents,
    };
  }

  /**
   * Displays seeder summary
   */
  private displaySummary(summary: SeederSummary, processedEvents: number, processedPrizes: number): void {
    console.log('\n' + '='.repeat(50));
    console.log('🎯 EVENT SEEDER SUMMARY');
    console.log('='.repeat(50));
    console.log(`📊 Total Events in Seed Data: ${summary.totalEvents}`);
    console.log(`📝 New Events Created: ${processedEvents}`);
    console.log(`🏆 New Prize Configurations: ${processedPrizes}`);
    console.log(`💰 Total Prize Pool: $${summary.totalPrizePool.toLocaleString()}`);
    console.log('');
    console.log('📈 Event Status Distribution:');
    console.log(`   🟢 Active: ${summary.activeEvents}`);
    console.log(`   🟡 Draft: ${summary.draftEvents}`);
    console.log(`   🔴 Ended: ${summary.endedEvents}`);
    console.log(`   ⚫ Cancelled: ${summary.cancelledEvents}`);
    console.log('='.repeat(50));
    console.log('✅ Event seeding completed successfully!');
  }
}
