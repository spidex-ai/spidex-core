export interface ZealyWebhookPayload {
  userId: string;
  communityId: string;
  subdomain: string;
  questId: string;
  requestId: string;
  accounts?: {
    wallet?: string;
  };
}

export interface ZealyWebhookResponse {
  success: boolean;
  message: string;
}

export interface ZealyWebhookErrorResponse {
  success: boolean;
  message: string;
}
