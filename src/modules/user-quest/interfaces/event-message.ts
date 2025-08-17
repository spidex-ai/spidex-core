export interface IQuestRelatedToTradeEvent {
  userId: number;
  txHash: string;
}

export interface ISocialQuestVerifyEvent {
  userId: number;
  questId: number;
  triggeredAt: Date;
}
