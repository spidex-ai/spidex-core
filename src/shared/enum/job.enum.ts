export enum AIJobProviderEnum {
  DISCORD = 'discord',
  TELEGRAM = 'telegram',
  TWITTER = 'twitter',
  SIMULATE_AUTOMATED_CONTENT_API = 'simulate_automated_content_api',
  CHAT_API = 'chat_api',
}

export enum AIJobTypeEnum {
  CHAT_WITHOUT_HISTORY = 'chat_without_history',
  CHAT_WITH_HISTORY = 'chat_with_history',
  GENERATE_IMAGE = 'generate_image',
}

export enum GptThreadJobTypeEnum {
  POLL_AND_GET_GPT_RESPONSE_IN_THREAD = 'poll_and_get_gpt_response_in_thread',
}

export enum GptThreadStatusEnum {
  RUNNING = 'running',
  IDLE = 'idle',
}

export enum GptModelPurpose {
  NORMAL = 'normal',
  GPT_ASSISTANT = 'gpt_assistant',
}

export enum GptThreadRunStatusEnum {
  QUEUED = 'queued',
  IN_PROGRESS = 'in_progress',
  REQUIRE_ACTION = 'requires_action',
  CANCELING = 'cancelling',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
  COMPLETED = 'completed',
  INCOMPLETE = 'incomplete',
  EXPIRED = 'expired',
}

export enum TwitterJobTypeEnum {
  CREATE_AUTOMATED_CONTENT = 'create_automated_content',
  CREATE_POST_WITH_AI_BY_CHAT = 'create_posts_with_ai_by_chat',
  REPLY_MENTION = 'reply_mention',
  REPLY_FOLLOWED_USER = 'reply_followed_user',
  GENERATE_IMAGE_FOR_TWEET = 'generate_image_for_tweet',
}

export enum ETwitterMediaType {
  VIDEO = 'video',
  GIF = 'gif',
  IMAGE = 'image',
}

export enum AIAgentCategoryEnum {
  GAMEFI = 'GAMEFI',
  DEFI = 'DEFI',
  ASSISTANT = 'ASSISTANT',
  CHATBOT = 'CHATBOT',
}
