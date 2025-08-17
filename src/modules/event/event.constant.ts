export enum EEventStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  CANCELLED = 'CANCELLED',
  PRIZES_DISTRIBUTED = 'PRIZES_DISTRIBUTED',
}

export enum EEventType {
  TRADING_COMPETITION = 'TRADING_COMPETITION',
  VOLUME_CHALLENGE = 'VOLUME_CHALLENGE',
  TOKEN_SPECIFIC = 'TOKEN_SPECIFIC',
}

export enum EEventTradeType {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum EParticipantStatus {
  ACTIVE = 'ACTIVE',
  DISQUALIFIED = 'DISQUALIFIED',
  PRIZE_CLAIMED = 'PRIZE_CLAIMED',
}

export enum ERankChangeType {
  UP = 'UP',
  DOWN = 'DOWN',
  NO_CHANGE = 'NO_CHANGE',
  NEW_ENTRY = 'NEW_ENTRY',
}

// ==================== Default Values & Limits ====================

export const EVENT_DEFAULT_LIMIT = 20;
export const EVENT_MAX_LIMIT = 100;
export const LEADERBOARD_DEFAULT_LIMIT = 50;
export const LEADERBOARD_MAX_LIMIT = 200;

export const EVENT_CACHE_TTL = 300; // 5 minutes
export const LEADERBOARD_CACHE_TTL = 60; // 1 minute

// ==================== Event Processing Constants ====================

export const MIN_TRADE_VOLUME_USD = 1; // Minimum $1 USD to count for events
export const MAX_PARTICIPANTS_PER_EVENT = 10000;
export const DEFAULT_TOKEN_DECIMALS = 18;

// ==================== Ranking & Leaderboard Constants ====================

export const RANK_UPDATE_INTERVAL_MINUTES = 5;
export const LEADERBOARD_CACHE_REFRESH_INTERVAL_MINUTES = 2;
export const MAX_LEADERBOARD_ENTRIES = 1000;

// ==================== Event Validation Constants ====================

export const MIN_EVENT_DURATION_HOURS = 1;
export const MAX_EVENT_DURATION_DAYS = 365;
export const MIN_PRIZE_AMOUNT_USD = 1;
export const MAX_TRADE_TOKENS_PER_EVENT = 50;

// ==================== Error Messages ====================

export const EVENT_ERROR_MESSAGES = {
  EVENT_NOT_FOUND: 'Event not found',
  EVENT_NOT_ACTIVE: 'Event is not currently active',
  EVENT_ALREADY_ENDED: 'Event has already ended',
  EVENT_NOT_STARTED: 'Event has not started yet',
  INVALID_TRADE_TOKENS: 'Invalid trade tokens configuration',
  PARTICIPANT_NOT_FOUND: 'Participant not found in this event',
  INSUFFICIENT_VOLUME: 'Trade volume does not meet minimum requirements',
  DUPLICATE_PARTICIPANT: 'User is already participating in this event',
  EVENT_AT_CAPACITY: 'Event has reached maximum participant capacity',
  INVALID_PRIZE_CONFIG: 'Invalid prize configuration',
  TRADE_PROCESSING_FAILED: 'Failed to process trade for event'
} as const;

// ==================== Event Processing Options ====================

export const EVENT_PROCESSING_OPTIONS = {
  AUTO_PARTICIPANT_CREATION: true,
  ENABLE_RANK_TRACKING: true,
  ENABLE_CACHE: true,
  BATCH_RANK_UPDATES: true,
  LOG_TRADE_PROCESSING: true
} as const;