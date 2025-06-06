export interface IQuestRelatedToReferralOptions {
  referralId: number;
}

export interface IQuestRelatedToTradeOptions {
  txHash: string;
}

export interface IQuestRelatedToSocialOptions {
  userQuestId: number;
}

export type TQuestOptions = IQuestRelatedToTradeOptions | IQuestRelatedToReferralOptions | IQuestRelatedToSocialOptions;
