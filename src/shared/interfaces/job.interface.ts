import { AIJobProviderEnum, AIJobTypeEnum, GptThreadJobTypeEnum, TwitterJobTypeEnum } from '@shared/enum/job.enum';

export interface AIJobInterface {
  requester: AIJobProviderEnum;
  type: AIJobTypeEnum;
  message?: string;
  tokenId?: number;
  aiAgentId?: number;
  additionalInformation?: any;
  threadId?: string;
  assistantId?: string;
  userId?: number;
  errorCodeIfErrorOccurred?: number;
  isJsonResponse?: boolean
}

export interface TelegramAndDiscordJobInterface {
  requester: AIJobProviderEnum;
  additionalInformation?: any;
  response: string;
}

export interface ReplyBotJob {
  channelId: string | number;
  messageId: string | number;
  authorId: string | number;
  content: string;
}

export interface ReplyTwitterJob {
  postIdId: string;
  content: string;
  socialId: string;
  socialName: string;
  socialUsername: string;
  socialAvatar: string;
  postCreatedAt: string;
  accessToken: string;
  accessTokenSecret: string;
  type: TwitterJobTypeEnum;
  botAccessTokenId: number;
  isTwitterVerified: boolean;
}

export interface TwitterAccountInfo {
  profile_image_url: string;
  name: string;
  username: string;
  id: string;
}

export interface GptThreadJob {
  requester: AIJobProviderEnum;
  type: AIJobTypeEnum;
  jobType: GptThreadJobTypeEnum;
  threadId?: string;
  assistantId?: string;
  runId?: string;
  userId?: number;
  additionalInformation?: any;
  aiAgentId?: number; // Using when send socket event
}

export interface TwitterJobInterface {
  type: TwitterJobTypeEnum;
  userId?: number;
  context?: string;
  mediaToSaveFeed?: any[];
  isReplied?: boolean;
  mediaArray?: [];
  botAccessToken?: string;
  uniqueSocketHash?: string;
  botAccessTokenSecret?: string;
  additionalInformation?: any;
  botAccessTokenId?: number;
  response: any;
}
