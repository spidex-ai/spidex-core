import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { DataSource } from 'typeorm';
import { Inject } from '@nestjs/common';
import { UserEntity } from '@database/entities/user.entity';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { RabbitMQService } from '@shared/modules/rabbitmq/rabbitmq.service';

export interface UserActivityEvent {
  userId: number;
  timestamp: Date;
  endpoint?: string;
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
    // Start the batch processing timer only in production
    if (process.env.NODE_ENV !== 'test') {
      this.startBatchProcessor();
    }
  }

  /**
   * Track user activity asynchronously
   * This method is designed to be non-blocking for API requests
   */
  async trackUserActivity(event: UserActivityEvent): Promise<void> {
    try {
      // Add to Redis batch for processing
      await this.addToBatch(event);

      this.logger.debug(`User activity tracked for user ${event.userId}`);
    } catch (error) {
      // Log error but don't throw to avoid blocking API requests
      this.logger.error('Error tracking user activity:', error);
    }
  }

  /**
   * Add user activity event to Redis batch
   */
  private async addToBatch(event: UserActivityEvent): Promise<void> {
    try {
      const eventData = JSON.stringify(event);
      await this.redis.lpush(this.ACTIVITY_BATCH_KEY, eventData);

      // Check if batch is ready for processing
      const batchSize = await this.redis.llen(this.ACTIVITY_BATCH_KEY);
      if (batchSize >= this.BATCH_SIZE) {
        await this.processBatch();
      }
    } catch (error) {
      this.logger.error('Error adding to activity batch:', error);
    }
  }

  /**
   * Process batched user activity updates
   */
  private async processBatch(): Promise<void> {
    try {
      // Get all events from the batch
      const events = await this.redis.lrange(this.ACTIVITY_BATCH_KEY, 0, this.BATCH_SIZE - 1);
      if (events.length === 0) return;

      // Remove processed events from the batch
      await this.redis.ltrim(this.ACTIVITY_BATCH_KEY, events.length, -1);

      // Parse events and group by user
      const userActivities = new Map<number, Date>();

      for (const eventStr of events) {
        try {
          const event: UserActivityEvent = JSON.parse(eventStr);
          const existingTimestamp = userActivities.get(event.userId);

          // Keep the latest timestamp for each user
          if (!existingTimestamp || event.timestamp > existingTimestamp) {
            userActivities.set(event.userId, event.timestamp);
          }
        } catch (parseError) {
          this.logger.warn('Error parsing activity event:', parseError);
        }
      }

      // Batch update user activities in database
      if (userActivities.size > 0) {
        await this.updateUserActivitiesInDatabase(userActivities);
        this.logger.info(`Processed ${userActivities.size} user activity updates`);
      }
    } catch (error) {
      this.logger.error('Error processing activity batch:', error);
    }
  }

  /**
   * Update user activities in database using batch update
   */
  private async updateUserActivitiesInDatabase(userActivities: Map<number, Date>): Promise<void> {
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      try {
        await queryRunner.startTransaction();

        // Build batch update query
        const userIds = Array.from(userActivities.keys());
        const cases = userIds
          .map(userId => {
            const timestamp = userActivities.get(userId)!.toISOString();
            return `WHEN ${userId} THEN '${timestamp}'`;
          })
          .join(' ');

        const query = `
          UPDATE users 
          SET last_activity_at = CASE id ${cases} END,
              updated_at = NOW()
          WHERE id IN (${userIds.join(',')})
        `;

        await queryRunner.query(query);
        await queryRunner.commitTransaction();

        this.logger.debug(`Updated last_activity_at for ${userIds.length} users`);
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error('Error updating user activities in database:', error);

      // Fallback: try individual updates
      await this.fallbackIndividualUpdates(userActivities);
    }
  }

  /**
   * Fallback method for individual user activity updates
   */
  private async fallbackIndividualUpdates(userActivities: Map<number, Date>): Promise<void> {
    const userRepository = this.dataSource.getRepository(UserEntity);

    for (const [userId, timestamp] of userActivities) {
      try {
        await userRepository.update(userId, { lastActivityAt: timestamp });
      } catch (error) {
        this.logger.warn(`Failed to update activity for user ${userId}:`, error);
      }
    }
  }

  /**
   * Start the batch processor timer
   */
  private startBatchProcessor(): void {
    this.batchProcessorTimer = setInterval(async () => {
      try {
        await this.processBatch();
      } catch (error) {
        this.logger.error('Error in batch processor timer:', error);
      }
    }, this.BATCH_TIMEOUT);
  }

  /**
   * Stop the batch processor timer
   */
  stopBatchProcessor(): void {
    if (this.batchProcessorTimer) {
      clearInterval(this.batchProcessorTimer);
      this.batchProcessorTimer = undefined;
    }
  }

  /**
   * Get user's last activity timestamp
   */
  async getUserLastActivity(userId: number): Promise<Date | null> {
    try {
      const user = await this.dataSource.getRepository(UserEntity).findOne({
        where: { id: userId },
        select: ['lastActivityAt'],
      });

      return user?.lastActivityAt || null;
    } catch (error) {
      this.logger.error(`Error getting last activity for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Force process all pending batches (useful for graceful shutdown)
   */
  async flushPendingActivities(): Promise<void> {
    try {
      let hasMore = true;
      while (hasMore) {
        const batchSize = await this.redis.llen(this.ACTIVITY_BATCH_KEY);
        if (batchSize > 0) {
          await this.processBatch();
        } else {
          hasMore = false;
        }
      }
      this.logger.info('All pending user activities flushed');
    } catch (error) {
      this.logger.error('Error flushing pending activities:', error);
    }
  }

  /**
   * Get activity tracking statistics
   */
  async getTrackingStats(): Promise<{ pendingBatchSize: number }> {
    try {
      const pendingBatchSize = await this.redis.llen(this.ACTIVITY_BATCH_KEY);
      return { pendingBatchSize };
    } catch (error) {
      this.logger.error('Error getting tracking stats:', error);
      return { pendingBatchSize: 0 };
    }
  }
}
