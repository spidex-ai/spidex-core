import { EEventStatus, EEventType, EventCustomData } from '@database/entities/event.entity';
import { SwapExchange } from '@database/entities/swap-transaction.entity';

/**
 * Interface for event seed data structure
 */
export interface EventSeedData {
  name: string;
  description: string;
  totalPrize: string;
  startDate: string;
  endDate: string;
  status: EEventStatus;
  type: EEventType;
  tradeToken: string;
  tradeDex?: SwapExchange | string;
  icon?: string;
  banner?: string;
  url?: string;
  eventHash?: string;
  customData?: EventCustomData[];
  estimateDistributionDate?: string;
  distributionDate?: string;
  createdBy?: number;
}

/**
 * Interface for event rank prize seed data structure
 */
export interface EventRankPrizeSeedData {
  eventHash: string;
  rankFrom: number;
  rankTo: number;
  prizePoints: string;
  prizeToken?: string;
  prizeTokenAmount?: string;
  description: string;
}

/**
 * Type for mapping event IDs to their prize configurations
 */
export type EventPrizeMap = Record<number, EventRankPrizeSeedData[]>;

/**
 * Interface for seeder result summary
 */
export interface SeederSummary {
  totalEvents: number;
  totalPrizeConfigurations: number;
  totalPrizePool: number;
  activeEvents: number;
  draftEvents: number;
  endedEvents: number;
  cancelledEvents: number;
}

/**
 * Type guard to check if an object is a valid EventSeedData
 */
export function isValidEventSeedData(obj: any): obj is EventSeedData {
  return (
    typeof obj === 'object' &&
    typeof obj.name === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.totalPrize === 'string' &&
    typeof obj.startDate === 'string' &&
    typeof obj.endDate === 'string' &&
    Object.values(EEventStatus).includes(obj.status) &&
    Object.values(EEventType).includes(obj.type) &&
    typeof obj.tradeToken === 'string'
  );
}

/**
 * Type guard to check if an object is a valid EventRankPrizeSeedData
 */
export function isValidEventRankPrizeSeedData(obj: any): obj is EventRankPrizeSeedData {
  return (
    typeof obj === 'object' &&
    typeof obj.eventHash === 'string' &&
    typeof obj.rankFrom === 'number' &&
    typeof obj.rankTo === 'number' &&
    typeof obj.prizePoints === 'string' &&
    typeof obj.description === 'string' &&
    obj.rankFrom <= obj.rankTo &&
    obj.rankFrom > 0 &&
    obj.rankTo > 0
  );
}

/**
 * Validates an array of event seed data
 */
export function validateEventSeedData(data: any[]): EventSeedData[] {
  const errors: string[] = [];
  const validEvents: EventSeedData[] = [];

  data.forEach((event, index) => {
    if (!isValidEventSeedData(event)) {
      errors.push(`Invalid event data at index ${index}: ${JSON.stringify(event)}`);
    } else {
      validEvents.push(event);
    }
  });

  if (errors.length > 0) {
    throw new Error(`Event seed data validation failed:\n${errors.join('\n')}`);
  }

  return validEvents;
}

/**
 * Validates an array of event rank prize seed data
 */
export function validateEventRankPrizeSeedData(data: any[]): EventRankPrizeSeedData[] {
  const errors: string[] = [];
  const validPrizes: EventRankPrizeSeedData[] = [];

  data.forEach((prize, index) => {
    if (!isValidEventRankPrizeSeedData(prize)) {
      errors.push(`Invalid prize data at index ${index}: ${JSON.stringify(prize)}`);
    } else {
      validPrizes.push(prize);
    }
  });

  if (errors.length > 0) {
    throw new Error(`Event rank prize seed data validation failed:\n${errors.join('\n')}`);
  }

  return validPrizes;
}
