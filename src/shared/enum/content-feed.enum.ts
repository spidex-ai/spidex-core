export enum ContentFeedTypeEnum {
  AUTOMATED_CONTENT = 'automated_content',
  CREATED_BY_CHAT_WITH_AI = 'created_by_chat_with_ai',
  REPLY_MENTION = 'reply_mention',
  REPLY_FOLLOWED_USER = 'reply_followed_user',
}

export enum ContentFeedStatusEnum {
  POSTED = 'posted',
  POSTING = 'posting',
  FAILED = 'failed',
}

export enum ContentFeedErrorCodeEnum {
  REACH_DAILY_RATE_LIMIT = 'reach_daily_rate_limit',
  NETWORK_ERROR = 'network_error',
  OTHER_ERROR = 'other_error',
  BOT_ACCESS_TOKEN_NOT_FOUND = 'bot_access_token_not_found',
}
