export interface UserActivity {
  userId: number;
  username?: string;
  lastActivity: Date;
  activityType: string;
}

export interface DailyActiveUsersResponse {
  date: string;
  activeUsers: number;
  details?: UserActivity[];
}

export interface TopVolumeUser {
  userId: number;
  username?: string;
  totalVolume: number;
  transactionCount: number;
}

export interface TopSilkPointUser {
  userId: number;
  username?: string;
  silkPoints: number;
  pointsEarned?: number;
}

export interface TopReferralUser {
  userId: number;
  username?: string;
  referralCount: number;
  referralRewards?: number;
}

export interface AnalyticsTimeframe {
  '1d': string;
  '7d': string;
  '30d': string;
  'all': string;
}

export interface AnalyticsCacheKeys {
  DAILY_ACTIVE_USERS: (date: string, timeRange: string) => string;
  TOP_VOLUME_USERS: (timeframe: string, limit: number) => string;
  TOP_SILK_POINT_USERS: (timeframe: string, limit: number) => string;
  TOP_REFERRAL_USERS: (timeframe: string, limit: number) => string;
}
