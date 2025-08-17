export interface IEventLeaderboardUpdateMessage {
  eventId: number;
  userId: number;
  newRank: number;
  totalVolume: string;
  updatedAt: Date;
}

export interface IEventPrizeDistributionMessage {
  eventId: number;
  participantId: number;
  userId: number;
  rank: number;
  prizePoints?: string;
  prizeToken?: string;
  prizeTokenAmount?: string;
  distributedAt: Date;
}

export interface IEventStatusChangedMessage {
  eventId: number;
  fromStatus: string;
  toStatus: string;
  changedAt: Date;
  changedBy?: number;
}

export interface IEventRecalculateMessage {
  eventId: number;
  requestedAt: Date;
}

export interface IEventRelatedTradeMessage {
  userId: number;
  usdVolume: string;
  tokenA: string;
  tokenB: string;
  tokenAAmount: string;
  tokenBAmount: string;
  txHash: string;
  timestamp: Date;
  transactionId: number;
  exchange: string; // Assuming this field exists
}
