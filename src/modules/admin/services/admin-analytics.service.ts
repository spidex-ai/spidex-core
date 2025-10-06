import {
  ADMIN_ANALYTICS_TOP_REFERRAL_USERS_CACHE_KEY,
  ADMIN_ANALYTICS_TOP_REFERRAL_USERS_CACHE_TTL,
  ADMIN_ANALYTICS_TOP_SILK_POINT_USERS_CACHE_KEY,
  ADMIN_ANALYTICS_TOP_SILK_POINT_USERS_CACHE_TTL,
  ADMIN_ANALYTICS_TOP_VOLUME_USERS_CACHE_KEY,
  ADMIN_ANALYTICS_TOP_VOLUME_USERS_CACHE_TTL,
} from '@constants/cache.constant';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Inject, Injectable } from '@nestjs/common';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { UserActivityTrackingService } from '@shared/services/user-activity-tracking.service';
import Redis from 'ioredis';
import { DataSource } from 'typeorm';
import { AnalyticsTimeframe } from '../dtos/admin-analytics.dto';
import { TopReferralUser, TopSilkPointUser, TopVolumeUser } from '../interfaces/admin-analytics.interface';

@Injectable()
export class AdminAnalyticsService {
  private readonly logger = this.loggerService.getLogger('AdminAnalyticsService');

  constructor(
    @InjectRedis() private readonly redis: Redis,
    @Inject(DataSource) private readonly dataSource: DataSource,
    private readonly loggerService: LoggerService,
    private readonly userActivityTrackingService: UserActivityTrackingService,
  ) {}

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
                   WHEN st.action = 'buy' THEN CAST(st.total_usd AS DECIMAL)
                   WHEN st.action = 'sell' THEN CAST(st.total_usd AS DECIMAL)
                   ELSE 0
                 END
               ), 0) as "totalVolume",
               COUNT(st.id) as "transactionCount"
        FROM users u
        LEFT JOIN swap_transactions st ON u.id = st.user_id 
          AND st.status = 'success' AND st.action='sell' ${dateFilter} 
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

  /**
   * Get DAU chart data for admin dashboard
   * @param days Number of days to retrieve (default: 30)
   * @returns Array of DAU data points for chart
   */
  async getDauChart(timezone: string, days: number = 30): Promise<{ date: string; activeUsers: number }[]> {
    try {
      // const cacheKey = `admin_analytics_dau_chart_${days}d`;

      // // Try to get from cache first
      // const cachedData = await this.redis.get(cacheKey);
      // if (cachedData) {
      //   this.logger.info(`Cache hit for DAU chart data: ${days} days`);
      //   return JSON.parse(cachedData);
      // }

      const chartData = await this.userActivityTrackingService.getDauChartData(timezone, days);
      console.log(`DAU chart data: ${JSON.stringify(chartData)}`);
      // Cache for 1 hour
      // await this.redis.setex(cacheKey, 3600, JSON.stringify(chartData));

      this.logger.info(`DAU chart data calculated for ${days} days: ${chartData.length} data points`);
      return chartData;
    } catch (error) {
      this.logger.error('Error getting DAU chart data:', error);
      throw error;
    }
  }

  /**
   * Get MAU chart data for admin dashboard
   * @param months Number of months to retrieve (default: 12)
   * @returns Array of MAU data points for chart
   */
  async getMauChart(timezone: string, months: number = 12): Promise<{ month: string; activeUsers: number }[]> {
    try {
      const cacheKey = `admin_analytics_mau_chart_${months}m`;

      // Try to get from cache first
      const cachedData = await this.redis.get(cacheKey);
      if (cachedData) {
        this.logger.info(`Cache hit for MAU chart data: ${months} months`);
        return JSON.parse(cachedData);
      }

      const chartData = await this.userActivityTrackingService.getMauChartData(timezone, months);

      // Cache for 2 hours
      await this.redis.setex(cacheKey, 7200, JSON.stringify(chartData));

      this.logger.info(`MAU chart data calculated for ${months} months: ${chartData.length} data points`);
      return chartData;
    } catch (error) {
      this.logger.error('Error getting MAU chart data:', error);
      throw error;
    }
  }

  /**
   * Get current user activity stats (DAU, MAU)
   */
  async getCurrentUserActivityStats(timezone: string): Promise<{
    currentDau: number;
    currentMau: number;
    lastUpdated: string;
  }> {
    try {
      const cacheKey = 'admin_analytics_current_user_stats';

      // Try to get from cache first
      const cachedData = await this.redis.get(cacheKey);
      if (cachedData) {
        this.logger.info('Cache hit for current user activity stats');
        return JSON.parse(cachedData);
      }

      const [currentDau, currentMau] = await Promise.all([
        this.userActivityTrackingService.getCurrentDau(timezone),
        this.userActivityTrackingService.getCurrentMau(timezone),
      ]);

      const stats = {
        currentDau,
        currentMau,
        lastUpdated: new Date().toISOString(),
      };

      // Cache for 15 minutes
      await this.redis.setex(cacheKey, 900, JSON.stringify(stats));

      this.logger.info(`Current user activity stats calculated: DAU=${currentDau}, MAU=${currentMau}`);
      return stats;
    } catch (error) {
      this.logger.error('Error getting current user activity stats:', error);
      throw error;
    }
  }

  /**
   * Debug method to check database contents
   */
  async debugDatabase(): Promise<any> {
    try {
      return await this.userActivityTrackingService.debugDatabaseContents();
    } catch (error) {
      this.logger.error('Error debugging database:', error);
      throw error;
    }
  }

  /**
   * Get user analytics data including login counts and wallet statistics
   * @returns Promise with user analytics data
   */
  /**
   * Get user analytics data including login counts and wallet statistics
   * @returns Promise with user analytics data
   */
  /**
   * Get user analytics data including total users and wallet statistics
   * @returns Promise with user analytics data
   */
  /**
   * Get user analytics data including total users and wallet statistics
   * @returns Promise with user analytics data
   */
  async getUserAnalytics(): Promise<{
    totalLoggedInUsers: number;
    totalConnectedWallets: number;
    walletTypeStats: Record<string, number>;
  }> {
    try {
      const cacheKey = 'admin_analytics_user_stats';

      // Try to get from cache first
      const cachedData = await this.redis.get(cacheKey);
      if (cachedData) {
        this.logger.info('Cache hit for user analytics data');
        return JSON.parse(cachedData);
      }

      this.logger.info('Cache miss for user analytics data');

      // Get total users in the system
      const totalUsersQuery = `
        SELECT COUNT(*) as count
        FROM users
      `;
      const [{ count: totalLoggedInUsers }] = await this.dataSource.query(totalUsersQuery);

      // Get total unique wallet addresses connected
      const totalConnectedWalletsQuery = `
        SELECT COUNT(*) as count
        FROM users 
        WHERE wallet_address IS NOT NULL
      `;
      const [{ count: totalConnectedWallets }] = await this.dataSource.query(totalConnectedWalletsQuery);

      // Get wallet type statistics based on last_used_wallet
      const walletTypeQuery = `
        SELECT 
          last_used_wallet,
          COUNT(*) as count
        FROM users 
        WHERE wallet_address IS NOT NULL 
          AND last_used_wallet IS NOT NULL
        GROUP BY last_used_wallet
      `;
      const walletTypeResults = await this.dataSource.query(walletTypeQuery);

      // Initialize wallet stats
      const walletTypeStats: Record<string, number> = {};

      // Map results to wallet types
      walletTypeResults.forEach((result: any) => {
        const walletType = result.last_used_wallet?.toLowerCase();
        const count = parseInt(result.count);

        if (walletType) {
          walletTypeStats[walletType] = count;
        }
      });

      const analyticsData = {
        totalLoggedInUsers: parseInt(totalLoggedInUsers),
        totalConnectedWallets: parseInt(totalConnectedWallets),
        walletTypeStats,
      };

      // Cache the result for 15 minutes
      await this.redis.setex(cacheKey, 900, JSON.stringify(analyticsData));

      this.logger.info(
        `User analytics calculated: ${totalLoggedInUsers} total users, ${totalConnectedWallets} wallets connected`,
      );
      return analyticsData;
    } catch (error) {
      this.logger.error('Error getting user analytics:', error);
      throw error;
    }
  }
}
