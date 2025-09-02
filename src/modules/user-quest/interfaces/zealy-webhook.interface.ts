export interface ZealyWebhookPayload {
  userId: string;
  communityId: string;
  subdomain: string;
  questId: string;
  requestId: string;
  accounts?: {
    email?: string;
    wallet?: string;
    discord?: {
      id: string;
      handle: string;
    };
    twitter?: {
      id: string;
      username: string;
    };
    'zealy-connect'?: string;
  };
}

export interface ZealyWebhookResponse {
  message: string;
}

export interface ZealyWebhookErrorResponse {
  message: string;
}