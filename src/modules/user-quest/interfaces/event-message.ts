
export interface IQuestRelatedToChatWithAiEvent {
    userId: number;
}

export interface IQuestRelatedToCreateAiAgentEvent {
    userId: number;
}

export interface IQuestRelatedToCreateFeedbackEvent {
    userId: number;
    feedbackId: number;
}