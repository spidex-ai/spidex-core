export interface IQuestRelatedToReferralOptions {
    referralId: number;
}

export interface IQuestRelatedToTradeOptions {
    txHash: string;
}

export type TQuestOptions = IQuestRelatedToTradeOptions | IQuestRelatedToReferralOptions;