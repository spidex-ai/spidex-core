import {
  EEventStatus,
  EEventTradeType,
  EEventType,
  EParticipantStatus,
  ERankChangeType,
} from '@modules/event/event.constant';
import { Decimal } from 'decimal.js';

// ==================== Core Event Types ====================

export interface IEventConfiguration {
  name: string;
  description: string;
  totalPrize: string | Decimal;
  startDate: Date;
  endDate: Date;
  type: EEventType;
  tradeToken: string;
  icon?: string;
}

// ==================== Event Processing Types ====================

export interface IEventTradeData {
  eventId: number;
  participantId: number;
  swapTransactionId: number;
  volumeUsd: string | Decimal;
  tokenTraded: string;
  tokenAmount: string | Decimal;
  tradeType: EEventTradeType;
  recordedAt: Date;
}

export interface IParticipantData {
  eventId: number;
  userId: number;
  totalVolume: string | Decimal;
  tradeCount: number;
  rank?: number;
  joinedAt: Date;
  lastTradeAt?: Date;
  status: EParticipantStatus;
  prizeClaimed: boolean;
  prizeClaimedAt?: Date;
}

// ==================== Event Processing Result Types ====================

export interface ITradeProcessingResult {
  success: boolean;
  eventId: number;
  participantId: number;
  tradeId: number;
  volumeProcessed: string;
  rankChange?: IRankChange;
  newParticipant: boolean;
  errors?: string[];
}

export interface IRankChange {
  userId: number;
  eventId: number;
  oldRank: number | null;
  newRank: number;
  changeType: ERankChangeType;
  volumeChange: string;
  timestamp: Date;
}

// ==================== Token Trading Types ====================

export interface ITokenTradeInfo {
  tokenAddress: string;
  tradeType: EEventTradeType;
  tokenAmount: string;
  volumeUsd: string;
}

export interface IEventTokenMatch {
  eventId: number;
  matchedToken: string;
  tradeType: EEventTradeType;
  isQualifyingTrade: boolean;
}

// ==================== Utility Types ====================

export type EventId = number;
export type UserId = number;
export type ParticipantId = number;
export type TradeId = number;
export type TokenAddress = string;
export type VolumeAmount = string | Decimal;

// Type guards for runtime type checking
export const isValidEventTradeType = (value: any): value is EEventTradeType => {
  return Object.values(EEventTradeType).includes(value);
};

export const isValidEventStatus = (value: any): value is EEventStatus => {
  return Object.values(EEventStatus).includes(value);
};

export const isValidParticipantStatus = (value: any): value is EParticipantStatus => {
  return Object.values(EParticipantStatus).includes(value);
};

// ==================== Event Processing Context Types ====================

export interface IEventProcessingContext {
  eventId: EventId;
  userId: UserId;
  transactionHash: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}
