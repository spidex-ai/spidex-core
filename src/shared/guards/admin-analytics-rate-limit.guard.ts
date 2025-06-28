import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { BadRequestException } from '@shared/exception';
import { EError } from '@constants/error.constant';
import { LoggerService } from '@shared/modules/loggers/logger.service';

@Injectable()
export class AdminAnalyticsRateLimitGuard implements CanActivate {
  private readonly logger = this.loggerService.getLogger('AdminAnalyticsRateLimitGuard');

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly loggerService: LoggerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const adminId = request.user?.adminId;

    if (!adminId) {
      throw new BadRequestException({
        message: 'Admin authentication required',
        validatorErrors: EError.UNAUTHORIZED,
      });
    }

    const endpoint = request.route?.path || request.url;
    const rateLimitKey = `admin_analytics_rate_limit:${adminId}:${endpoint}`;

    try {
      // Rate limit: 30 requests per minute per admin per endpoint
      const currentCount = await this.redis.incr(rateLimitKey);

      if (currentCount === 1) {
        // Set expiration for the first request
        await this.redis.expire(rateLimitKey, 60); // 1 minute
      }

      if (currentCount > 30) {
        this.logger.warn(`Rate limit exceeded for admin ${adminId} on endpoint ${endpoint}`);
        throw new BadRequestException({
          message: 'Rate limit exceeded. Maximum 30 requests per minute per endpoint.',
          validatorErrors: EError.RATE_LIMIT_EXCEED,
        });
      }

      this.logger.debug(`Admin ${adminId} analytics request ${currentCount}/30 for ${endpoint}`);
      return true;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error('Error in rate limiting:', error);
      // Allow request to proceed if rate limiting fails
      return true;
    }
  }
}
