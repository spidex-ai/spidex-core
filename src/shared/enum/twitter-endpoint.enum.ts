export enum TwitterEndpointEnum {
  POST_TWEET_AND_COMMENT = 'post_tweet_and_comment',
  GET_MENTIONS = 'get_mentions',
  GET_TWEETS = 'get_tweets',
  GET_USER_TWEET_TIMELINE = 'get_user_tweet_timeline',
}

export enum PurposeEnum {
  CREATE_AUTOMATED_CONTENT = 'create_automated_content',
  CREATE_POST_WITH_AI_BY_CHAT = 'create_posts_with_ai_by_chat',
  REPLY_MENTION = 'reply_mention',
  REPLY_FOLLOWED_USER = 'reply_followed_user',
}

export enum ThresholdPercentageForPurposeEnum {
  CREATE_AUTOMATED_CONTENT = 0.1,
  CREATE_POST_WITH_AI_BY_CHAT = 0.2,
  REPLY_FOLLOWED_USER = 0.3,
  REPLY_MENTION = 0.4,
}
