import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { DataSource, MoreThanOrEqual } from 'typeorm';
import { Inject } from '@nestjs/common';
import {
  ADMIN_ANALYTICS_DAILY_ACTIVE_USERS_CACHE_KEY,
  ADMIN_ANALYTICS_DAILY_ACTIVE_USERS_CACHE_TTL,
  ADMIN_ANALYTICS_TOP_VOLUME_USERS_CACHE_KEY,
  ADMIN_ANALYTICS_TOP_VOLUME_USERS_CACHE_TTL,
  ADMIN_ANALYTICS_TOP_SILK_POINT_USERS_CACHE_KEY,
  ADMIN_ANALYTICS_TOP_SILK_POINT_USERS_CACHE_TTL,
  ADMIN_ANALYTICS_TOP_REFERRAL_USERS_CACHE_KEY,
  ADMIN_ANALYTICS_TOP_REFERRAL_USERS_CACHE_TTL,
} from '@constants/cache.constant';
import {
  DailyActiveUsersResponse,
  TopVolumeUser,
  TopSilkPointUser,
  TopReferralUser,
} from '../interfaces/admin-analytics.interface';
import { AnalyticsTimeframe, AnalyticsTimeRange } from '../dtos/admin-analytics.dto';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { UserRepository } from '@database/repositories/user.repository';
import { getStartOfDay } from '@shared/utils/dayjs';

@Injectable()
export class AdminAnalyticsService {
  private readonly logger = this.loggerService.getLogger('AdminAnalyticsService');

  constructor(
    @InjectRedis() private readonly redis: Redis,
    @Inject(DataSource) private readonly dataSource: DataSource,
    private readonly loggerService: LoggerService,
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * Get daily active users with optional time range analysis
   * @param date - Date in YYYY-MM-DD format (default: current date)
   * @param timeRange - Time range for analysis (1d, 7d, 30d)
   * @param includeDetails - Whether to include detailed user activity
   * @returns Promise with daily active users data
   */
  async getDailyActiveUsers(): Promise<DailyActiveUsersResponse> {
    try {
      const startOfDay = getStartOfDay(new Date());
      const cacheKey = ADMIN_ANALYTICS_DAILY_ACTIVE_USERS_CACHE_KEY();

      // Try to get from cache first
      const cachedData = await this.redis.get(cacheKey);
      if (cachedData) {
        this.logger.info(`Cache hit for daily active users: ${startOfDay.toISOString()}`);
        return JSON.parse(cachedData);
      }

      const activeUsers = await this.userRepository.find({
        where: {
          lastActivityAt: MoreThanOrEqual(startOfDay),
        },
      });

      const result: DailyActiveUsersResponse = {
        date: startOfDay.toISOString(),
        activeUsers: activeUsers.length,
        details: activeUsers.map(user => ({
          userId: user.id,
          username: user.username,
          lastActivity: user.lastActivityAt,
          activityType: 'api_activity',
        })),
      };

      // Cache the result
      await this.redis.setex(
        cacheKey,
        Math.floor(ADMIN_ANALYTICS_DAILY_ACTIVE_USERS_CACHE_TTL / 1000),
        JSON.stringify(result),
      );

      return result;
    } catch (error) {
      this.logger.error('Error getting daily active users:', error);
      throw error;
    }
  }

  /**
   * Get top users by trcreateading/transaction volume
   * @param timeframe - Timeframe for analysis (1d, 7d, 30d, all)
   * @param limit - Number of top users to return (max 100)
   * @returns Promise with top volume users data
   */
  async getTopVolumeUsers(
    timeframe: AnalyticsTimeframe = AnalyticsTimeframe.ONE_DAY,
    limit = 10,
  ): Promise<TopVolumeUser[]> {
    try {
      const cacheKey = ADMIN_ANALYTICS_TOP_VOLUME_USERS_CACHE_KEY(timeframe, limit);

      // Try to get from cache first
      const cachedData = await this.redis.get(cacheKey);
      if (cachedData) {
        this.logger.info(`Cache hit for top volume users: ${timeframe}, limit: ${limit}`);
        return JSON.parse(cachedData);
      }

      this.logger.info(`Cache miss for top volume users: ${timeframe}, limit: ${limit}`);

      // Calculate date filter based on timeframe
      let dateFilter = '';
      if (timeframe !== AnalyticsTimeframe.ALL_TIME) {
        const days = this.getTimeframeDays(timeframe);
        dateFilter = `AND st.created_at >= NOW() - INTERVAL '${days} days'`;
      }

      // Query for top volume users based on swap transactions
      const query = `
        SELECT u.id as "userId", u.username,
               COALESCE(SUM(
                 CASE 
                   WHEN st.action = 'buy' THEN CAST(st.token_a_amount AS DECIMAL)
                   WHEN st.action = 'sell' THEN CAST(st.token_b_amount AS DECIMAL)
                   ELSE 0
                 END
               ), 0) as "totalVolume",
               COUNT(st.id) as "transactionCount"
        FROM users u
        LEFT JOIN swap_transactions st ON u.id = st.user_id 
          AND st.status = 'success' ${dateFilter}
        GROUP BY u.id, u.username
        HAVING COUNT(st.id) > 0
        ORDER BY "totalVolume" DESC, "transactionCount" DESC
        LIMIT $1
      `;

      const topUsers = await this.dataSource.query(query, [limit]);

      // Cache the result
      await this.redis.setex(
        cacheKey,
        Math.floor(ADMIN_ANALYTICS_TOP_VOLUME_USERS_CACHE_TTL / 1000),
        JSON.stringify(topUsers),
      );

      this.logger.info(`Top volume users calculated: ${topUsers.length} users for ${timeframe}`);
      return topUsers;
    } catch (error) {
      this.logger.error('Error getting top volume users:', error);
      throw error;
    }
  }

  /**
   * Get top users by silk point balances or earnings
   * @param timeframe - Timeframe for analysis (1d, 7d, 30d, all)
   * @param limit - Number of top users to return (max 100)
   * @returns Promise with top silk point users data
   */
  async getTopSilkPointUsers(
    timeframe: AnalyticsTimeframe = AnalyticsTimeframe.ONE_DAY,
    limit = 10,
  ): Promise<TopSilkPointUser[]> {
    try {
      const cacheKey = ADMIN_ANALYTICS_TOP_SILK_POINT_USERS_CACHE_KEY(timeframe, limit);

      // Try to get from cache first
      const cachedData = await this.redis.get(cacheKey);
      if (cachedData) {
        this.logger.info(`Cache hit for top silk point users: ${timeframe}, limit: ${limit}`);
        return JSON.parse(cachedData);
      }

      this.logger.info(`Cache miss for top silk point users: ${timeframe}, limit: ${limit}`);

      // Calculate date filter based on timeframe
      let dateFilter = '';
      if (timeframe !== AnalyticsTimeframe.ALL_TIME) {
        const days = this.getTimeframeDays(timeframe);
        dateFilter = `AND upl.created_at >= NOW() - INTERVAL '${days} days'`;
      }

      // Query for top silk point users
      const query = `
        SELECT u.id as "userId", u.username,
               COALESCE(up.amount, '0') as "silkPoints",
               COALESCE(SUM(CAST(upl.amount AS DECIMAL)), 0) as "pointsEarned"
        FROM users u
        LEFT JOIN user_points up ON u.id = up.user_id
        LEFT JOIN user_point_logs upl ON u.id = upl.user_id ${dateFilter}
        GROUP BY u.id, u.username, up.amount
        HAVING COALESCE(up.amount, '0') != '0' OR COALESCE(SUM(CAST(upl.amount AS DECIMAL)), 0) > 0
        ORDER BY CAST(COALESCE(up.amount, '0') AS DECIMAL) DESC, "pointsEarned" DESC
        LIMIT $1
      `;

      const topUsers = await this.dataSource.query(query, [limit]);

      // Convert string amounts to numbers for response
      const result = topUsers.map((user: any) => ({
        ...user,
        silkPoints: parseFloat(user.silkPoints),
        pointsEarned: parseFloat(user.pointsEarned),
      }));

      // Cache the result
      await this.redis.setex(
        cacheKey,
        Math.floor(ADMIN_ANALYTICS_TOP_SILK_POINT_USERS_CACHE_TTL / 1000),
        JSON.stringify(result),
      );

      this.logger.info(`Top silk point users calculated: ${result.length} users for ${timeframe}`);
      return result;
    } catch (error) {
      this.logger.error('Error getting top silk point users:', error);
      throw error;
    }
  }

  /**
   * Get top users by referral count and rewards
   * @param timeframe - Timeframe for analysis (1d, 7d, 30d, all)
   * @param limit - Number of top users to return (max 100)
   * @returns Promise with top referral users data
   */
  async getTopReferralUsers(
    timeframe: AnalyticsTimeframe = AnalyticsTimeframe.ONE_DAY,
    limit = 10,
  ): Promise<TopReferralUser[]> {
    try {
      const cacheKey = ADMIN_ANALYTICS_TOP_REFERRAL_USERS_CACHE_KEY(timeframe, limit);

      // Try to get from cache first
      const cachedData = await this.redis.get(cacheKey);
      if (cachedData) {
        this.logger.info(`Cache hit for top referral users: ${timeframe}, limit: ${limit}`);
        return JSON.parse(cachedData);
      }

      this.logger.info(`Cache miss for top referral users: ${timeframe}, limit: ${limit}`);

      // Calculate date filter based on timeframe
      let dateFilter = '';
      if (timeframe !== AnalyticsTimeframe.ALL_TIME) {
        const days = this.getTimeframeDays(timeframe);
        dateFilter = `AND ur.created_at >= NOW() - INTERVAL '${days} days'`;
      }

      // Query for top referral users
      const query = `
        SELECT u.id as "userId", u.username,
               COUNT(ur.user_id) as "referralCount",
               COALESCE(SUM(CAST(ur.points AS DECIMAL)), 0) as "referralRewards"
        FROM users u
        LEFT JOIN user_referrals ur ON u.id = ur.referred_by ${dateFilter}
        GROUP BY u.id, u.username
        HAVING COUNT(ur.user_id) > 0
        ORDER BY "referralCount" DESC, "referralRewards" DESC
        LIMIT $1
      `;

      const topUsers = await this.dataSource.query(query, [limit]);

      // Convert string amounts to numbers for response
      const result = topUsers.map((user: any) => ({
        ...user,
        referralCount: parseInt(user.referralCount),
        referralRewards: parseFloat(user.referralRewards),
      }));

      // Cache the result
      await this.redis.setex(
        cacheKey,
        Math.floor(ADMIN_ANALYTICS_TOP_REFERRAL_USERS_CACHE_TTL / 1000),
        JSON.stringify(result),
      );

      this.logger.info(`Top referral users calculated: ${result.length} users for ${timeframe}`);
      return result;
    } catch (error) {
      this.logger.error('Error getting top referral users:', error);
      throw error;
    }
  }

  /**
   * Helper method to convert timeframe to days
   */
  private getTimeframeDays(timeframe: AnalyticsTimeframe): number {
    switch (timeframe) {
      case AnalyticsTimeframe.ONE_DAY:
        return 1;
      case AnalyticsTimeframe.SEVEN_DAYS:
        return 7;
      case AnalyticsTimeframe.THIRTY_DAYS:
        return 30;
      default:
        return 1;
    }
  }

  /**
   * Clear analytics cache for a specific type or all analytics cache
   * @param cacheType - Type of cache to clear (optional, clears all if not specified)
   */
  async clearAnalyticsCache(cacheType?: string): Promise<void> {
    try {
      const pattern = cacheType ? `admin_analytics_${cacheType}_*` : 'admin_analytics_*';
      const keys = await this.redis.keys(pattern);

      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.info(`Cleared ${keys.length} analytics cache keys with pattern: ${pattern}`);
      } else {
        this.logger.info(`No analytics cache keys found with pattern: ${pattern}`);
      }
    } catch (error) {
      this.logger.error('Error clearing analytics cache:', error);
      throw error;
    }
  }
}
