import { UserActivityEntity } from '@database/entities/user-activity.entity';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Inject, Injectable } from '@nestjs/common';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { RabbitMQService } from '@shared/modules/rabbitmq/rabbitmq.service';
import Redis from 'ioredis';
import { DataSource } from 'typeorm';

export interface UserActivityEvent {
  userId: number;
  timestamp: Date;
  timezone?: string;
  endpoint?: string;
  method?: string;
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class UserActivityTrackingService {
  private readonly logger = this.loggerService.getLogger('UserActivityTrackingService');
  private readonly ACTIVITY_BATCH_KEY = 'user_activity_batch';
  private readonly BATCH_SIZE = 50;
  private readonly BATCH_TIMEOUT = 30000; // 30 seconds
  private batchProcessorTimer?: NodeJS.Timeout;

  constructor(
    @InjectRedis() private readonly redis: Redis,
    @Inject(DataSource) private readonly dataSource: DataSource,
    private readonly loggerService: LoggerService,
    private readonly rabbitMQService: RabbitMQService,
  ) {
    this.logger.info('UserActivityTrackingService initialized');
    this.startBatchProcessor();
  }

  /**
   * Track user activity asynchronously
   * This method is designed to be non-blocking for API requests
   */
  async trackUserActivity(event: UserActivityEvent): Promise<void> {
    try {
      const timezone = event.timezone || 'UTC';
      
      // Calculate activity date in the user's timezone
      const userTimestamp = new Date(event.timestamp.toLocaleString('en-US', { timeZone: timezone }));
      const activityDate = userTimestamp.toISOString().split('T')[0];

      // Add to Redis batch for efficient processing
      await this.redis.lpush(
        this.ACTIVITY_BATCH_KEY,
        JSON.stringify({
          ...event,
          timestamp: event.timestamp.toISOString(),
          activityDate: activityDate,
          timezone: timezone,
        }),
      );

      // Process batch if size threshold reached
      const batchSize = await this.redis.llen(this.ACTIVITY_BATCH_KEY);
      if (batchSize >= this.BATCH_SIZE) {
        await this.processBatch();
      } else if (!this.batchProcessorTimer) {
        // Start batch processor timer if not already running
        this.startBatchProcessor();
      }
    } catch (error) {
      this.logger.error('Failed to track user activity', { error: error.message, event });
    }
  }

  /**
   * Process batched activities and save to database
   */
  private async processBatch(): Promise<void> {
    try {
      const activities = await this.redis.lrange(this.ACTIVITY_BATCH_KEY, 0, this.BATCH_SIZE - 1);
      if (activities.length === 0) return;

      // Remove processed items from Redis
      await this.redis.ltrim(this.ACTIVITY_BATCH_KEY, activities.length, -1);

      // Prepare bulk insert data
      const activityData = activities.map(activity => {
        const parsed = JSON.parse(activity);
        return {
          userId: parsed.userId,
          timestamp: new Date(parsed.timestamp),
          activityDate: new Date(parsed.activityDate),
          endpoint: parsed.endpoint,
          method: parsed.method,
          userAgent: parsed.userAgent,
          ipAddress: parsed.ipAddress,
        };
      });

      // Bulk insert to database
      await this.dataSource.createQueryBuilder().insert().into(UserActivityEntity).values(activityData).execute();

      this.logger.info(`Processed ${activities.length} user activities`);
    } catch (error) {
      this.logger.error('Failed to process activity batch', { error: error.message });
    }
  }

  /**
   * Start batch processor timer
   */
  private startBatchProcessor(): void {
    this.batchProcessorTimer = setTimeout(async () => {
      await this.processBatch();
      this.batchProcessorTimer = undefined;

      // Continue processing if there are more items
      const remainingCount = await this.redis.llen(this.ACTIVITY_BATCH_KEY);
      if (remainingCount > 0) {
        this.startBatchProcessor();
      }
    }, this.BATCH_TIMEOUT);
  }

  /**
   * Get Daily Active Users (DAU) chart data
   * @param timezone Timezone string (e.g., 'America/New_York', 'UTC')
   * @param days Number of days to retrieve (default: 30)
   * @returns Array of DAU data points for chart
   */
  async getDauChartData(timezone: string = 'UTC', days: number = 30): Promise<{ date: string; activeUsers: number }[]> {
    try {
      // Get current date in the specified timezone
      const now = new Date();
      const endDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - days);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      this.logger.info(`Getting DAU chart data from ${startDateStr} to ${endDateStr} (${days} days) in timezone: ${timezone}`);

      // Query using timezone-aware date filtering
      const query = `
        SELECT 
          (timestamp AT TIME ZONE 'UTC' AT TIME ZONE $3)::date as date,
          COUNT(DISTINCT user_id) as active_users
        FROM user_activities 
        WHERE (timestamp AT TIME ZONE 'UTC' AT TIME ZONE $3)::date >= $1::date
          AND (timestamp AT TIME ZONE 'UTC' AT TIME ZONE $3)::date <= $2::date
        GROUP BY (timestamp AT TIME ZONE 'UTC' AT TIME ZONE $3)::date
        ORDER BY date ASC
      `;

      this.logger.info(`Executing DAU query with timezone: ${query}`);
      this.logger.info(`Query parameters: [${startDateStr}, ${endDateStr}, ${timezone}]`);

      const result = await this.dataSource.query(query, [startDateStr, endDateStr, timezone]);
      
      this.logger.info(`Query result: ${JSON.stringify(result)}`);
      this.logger.info(`Number of days with data: ${result.length}`);

      // Fill in missing dates with 0 active users
      const chartData: { date: string; activeUsers: number }[] = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayData = result.find((row: any) => {
          // Convert database date to string for comparison
          const dbDateStr = row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date;
          return dbDateStr === dateStr;
        });
        
        const activeUsers = dayData ? parseInt(dayData.active_users) : 0;
        
        chartData.push({
          date: dateStr,
          activeUsers: activeUsers
        });
        
        this.logger.debug(`Date: ${dateStr}, Active Users: ${activeUsers}, Found Data: ${!!dayData}`);
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      this.logger.info(`Final chart data: ${JSON.stringify(chartData.slice(0, 5))}... (showing first 5 entries)`);
      return chartData;
    } catch (error) {
      this.logger.error('Failed to get DAU chart data', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Get Monthly Active Users (MAU) chart data
   * @param timezone Timezone string (e.g., 'America/New_York', 'UTC')
   * @param months Number of months to retrieve (default: 12)
   * @returns Array of MAU data points for chart
   */
  async getMauChartData(timezone: string = 'UTC', months: number = 12): Promise<{ month: string; activeUsers: number }[]> {
    try {
      // Get date range in the specified timezone
      const now = new Date();
      const endDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
      const startDate = new Date(endDate);
      startDate.setMonth(endDate.getMonth() - months);
      startDate.setDate(1); // First day of the month

      const query = `
        SELECT 
          DATE_TRUNC('month', (timestamp AT TIME ZONE 'UTC' AT TIME ZONE $3)::date)::date as month,
          COUNT(DISTINCT user_id) as active_users
        FROM user_activities 
        WHERE (timestamp AT TIME ZONE 'UTC' AT TIME ZONE $3)::date >= $1::date
          AND (timestamp AT TIME ZONE 'UTC' AT TIME ZONE $3)::date <= $2::date
        GROUP BY DATE_TRUNC('month', (timestamp AT TIME ZONE 'UTC' AT TIME ZONE $3)::date)
        ORDER BY month ASC
      `;

      this.logger.info(`Getting MAU chart data from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]} in timezone: ${timezone}`);

      const result = await this.dataSource.query(query, [
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        timezone
      ]);

      // Fill in missing months with 0 active users
      const chartData: { month: string; activeUsers: number }[] = [];
      const currentMonth = new Date(startDate);
      
      while (currentMonth <= endDate) {
        const monthStr = currentMonth.toISOString().split('T')[0].substring(0, 7); // YYYY-MM format
        const monthData = result.find((row: any) => {
          // Convert database date to string for comparison
          const dbMonthStr = row.month instanceof Date 
            ? row.month.toISOString().split('T')[0].substring(0, 7)
            : row.month.toString().substring(0, 7);
          return dbMonthStr === monthStr;
        });
        
        chartData.push({
          month: monthStr,
          activeUsers: monthData ? parseInt(monthData.active_users) : 0
        });
        
        currentMonth.setMonth(currentMonth.getMonth() + 1);
      }

      return chartData;
    } catch (error) {
      this.logger.error('Failed to get MAU chart data', { error: error.message });
      throw error;
    }
  }

  /**
   * Get current DAU (today's active users)
   * @param timezone Timezone string for determining "today"
   */
  async getCurrentDau(timezone: string = 'UTC'): Promise<number> {
    try {
      // Get today's date in the specified timezone
      const now = new Date();
      const todayInTimezone = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
      const today = todayInTimezone.toISOString().split('T')[0];
      
      const query = `
        SELECT COUNT(DISTINCT user_id) as active_users
        FROM user_activities 
        WHERE (timestamp AT TIME ZONE 'UTC' AT TIME ZONE $2)::date = $1::date
      `;

      const result = await this.dataSource.query(query, [today, timezone]);
      return parseInt(result[0]?.active_users || '0');
    } catch (error) {
      this.logger.error('Failed to get current DAU', { error: error.message });
      return 0;
    }
  }

  /**
   * Get current MAU (last 30 days active users)
   * @param timezone Timezone string for determining date range
   */
  async getCurrentMau(timezone: string = 'UTC'): Promise<number> {
    try {
      // Get date range in the specified timezone
      const now = new Date();
      const todayInTimezone = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
      const thirtyDaysAgo = new Date(todayInTimezone);
      thirtyDaysAgo.setDate(todayInTimezone.getDate() - 30);
      
      const query = `
        SELECT COUNT(DISTINCT user_id) as active_users
        FROM user_activities 
        WHERE (timestamp AT TIME ZONE 'UTC' AT TIME ZONE $2)::date >= $1::date
      `;

      const result = await this.dataSource.query(query, [thirtyDaysAgo.toISOString().split('T')[0], timezone]);
      return parseInt(result[0]?.active_users || '0');
    } catch (error) {
      this.logger.error('Failed to get current MAU', { error: error.message });
      return 0;
    }
  }

  /**
   * Debug method to check database contents
   */
  async debugDatabaseContents(): Promise<any> {
    try {
      // Check if table exists
      const tableExistsQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'user_activities'
        );
      `;
      const tableExists = await this.dataSource.query(tableExistsQuery);
      this.logger.info(`Table exists: ${JSON.stringify(tableExists)}`);

      // Get table structure
      const tableStructureQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'user_activities'
        ORDER BY ordinal_position;
      `;
      const tableStructure = await this.dataSource.query(tableStructureQuery);
      this.logger.info(`Table structure: ${JSON.stringify(tableStructure)}`);

      // Get some sample data
      const sampleDataQuery = `
        SELECT id, user_id, timestamp, activity_date, endpoint, method 
        FROM user_activities 
        ORDER BY created_at DESC 
        LIMIT 10
      `;
      const sampleData = await this.dataSource.query(sampleDataQuery);
      this.logger.info(`Sample data: ${JSON.stringify(sampleData)}`);

      // Get date range of data
      const dateRangeQuery = `
        SELECT 
          MIN(activity_date) as min_date,
          MAX(activity_date) as max_date,
          COUNT(*) as total_records,
          COUNT(DISTINCT user_id) as unique_users
        FROM user_activities
      `;
      const dateRange = await this.dataSource.query(dateRangeQuery);
      this.logger.info(`Date range and stats: ${JSON.stringify(dateRange)}`);

      return {
        tableExists: tableExists[0]?.exists,
        tableStructure,
        sampleData,
        dateRange: dateRange[0]
      };
    } catch (error) {
      this.logger.error('Failed to debug database contents', { error: error.message });
      throw error;
    }
  }
}
