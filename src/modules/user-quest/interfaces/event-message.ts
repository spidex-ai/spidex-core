export interface IQuestRelatedToTradeEvent {
  userId: number;
  txHash: string;
}

export interface ISocialQuestVerifyEvent {
  userId: number;
  questId: number;
  userQuestId: number;
  triggeredAt: Date;
}
