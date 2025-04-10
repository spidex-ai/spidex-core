import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RateLimiterService {
  constructor(
    private configService: ConfigService,
    private loggerService: LoggerService,
    @InjectRedis() private readonly redis: Redis,
  ) {
  }
  private logger = this.loggerService.getLogger('RateLimiterService');

  // Solution 1: Using Lua script
  async isAllowed(redisKey: string, windowSize: number, maxRequests: number, requestNumber: number = 1): Promise<boolean> {
    const currentTime = Date.now();
    const windowStart = currentTime - windowSize;

    const luaScript = `local key = KEYS[1]
          local now = tonumber(ARGV[1])
          local window_start = tonumber(ARGV[2])
          local max_requests = tonumber(ARGV[3])
          local window_size = tonumber(ARGV[4])
          local n = tonumber(ARGV[5])
          local uuid = ARGV[6]
          
          redis.call('ZREMRANGEBYSCORE', key, 0, window_start)
          local count = redis.call('ZCARD', key)
          redis.call('EXPIRE', key, math.ceil(window_size / 1000))
          
          if count + n > max_requests then
            return 0
          end
          
          for i = 1, n do
            redis.call('ZADD', key, now, tostring(now) .. "-" .. uuid .. "-" .. tostring(i))
          end
          return 1`;

    const result = await this.redis.eval(
      luaScript as any,
      1, // Number of keys
      redisKey, // Redis key
      currentTime.toString() as any, // Current time
      windowStart.toString() as any, // Start of the window
      maxRequests.toString() as any, // Max allowed requests
      windowSize.toString() as any, // Window size
      requestNumber, // Request number
      uuidv4() // uuid
    );

    return result === 1;
  }

  // Solution 2:
  // async isAllowed(model: string, windowSize: number, maxRequests: number): Promise<boolean> {
  //   const currentTime = Date.now();
  //   const windowStart = currentTime - windowSize;
  //
  //   // Use a Redis sorted set (ZADD/ZRANGE) to track timestamps
  //   const redisKey = `rate-limiter:${model}-rate-limit`;
  //
  //   // Remove timestamps outside the sliding window
  //   await this.redis.zremrangebyscore(redisKey, 0, windowStart);
  //
  //   // Add the current request timestamp to the sorted set
  //   await this.redis.zadd(redisKey, currentTime, currentTime.toString());
  //
  //   // Count the number of requests in the sliding window
  //   const requestCount = await this.redis.zcard(redisKey);
  //   console.log('requestCount: ', requestCount);
  //
  //   // Optional: Set an expiration time to prevent unused keys from persisting
  //   await this.redis.expire(redisKey, Math.ceil(windowSize / 1000));
  //
  //   // Check if request count exceeds the limit
  //   return requestCount <= maxRequests;
  // }

  // Lua script for two separate Redis keys
  async isAllowedForTwoKeys(
    redisKey1: string,
    window1Size: number,
    maxRequests1: number,
    redisKey2: string,
    window2Size: number,
    maxRequests2: number,
    requestNumber: number = 1
  ): Promise<boolean> {
    const currentTime = Date.now();
    const window1Start = currentTime - window1Size;
    const window2Start = currentTime - window2Size;

    const luaScript = `
        local key1 = KEYS[1]
        local key2 = KEYS[2]
        local now = tonumber(ARGV[1])
        local window1_start = tonumber(ARGV[2])
        local max_requests1 = tonumber(ARGV[3])
        local window1_size = tonumber(ARGV[4])
        local window2_start = tonumber(ARGV[5])
        local max_requests2 = tonumber(ARGV[6])
        local window2_size = tonumber(ARGV[7])
        local n = tonumber(ARGV[8])
        local uuid = ARGV[9]

        -- Process for key1
        redis.call('ZREMRANGEBYSCORE', key1, 0, window1_start)
        local count1 = redis.call('ZCARD', key1)
        redis.call('EXPIRE', key1, math.ceil(window1_size / 1000))

        if count1 + n > max_requests1 then
          return 0
        end

        -- Process for key2
        redis.call('ZREMRANGEBYSCORE', key2, 0, window2_start)
        local count2 = redis.call('ZCARD', key2)
        redis.call('EXPIRE', key2, math.ceil(window2_size / 1000))

        if count2 + n > max_requests2 then
          return 0
        end

        -- Add requests for both keys
        for i = 1, n do
          redis.call('ZADD', key1, now, tostring(now) .. "-" .. uuid .. "-" .. tostring(i))
          redis.call('ZADD', key2, now, tostring(now) .. "-" .. uuid .. "-" .. tostring(i))
        end
        return 1
    `;

    const result = await this.redis.eval(
      luaScript as any,
      2, // Number of keys
      redisKey1, // Redis key 1
      redisKey2 as any, // Redis key 2
      currentTime.toString() as any, // Current time
      window1Start.toString() as any, // Start of window 1
      maxRequests1.toString() as any, // Max requests for window 1
      window1Size.toString() as any, // Size of window 1
      window2Start.toString() as any, // Start of window 2
      maxRequests2.toString() as any, // Max requests for window 2
      window2Size.toString() as any, // Size of window 2
      requestNumber, // Request number
      uuidv4() // uuid
    );

    return result === 1;
  }


  async throwIfRateLimited(redisKey: string, windowSize: number, maxRequests: number) {
    const allowed = await this.isAllowed(redisKey, windowSize, maxRequests);
    if (!allowed) {
      throw new Error(
        'Rate limit exceeded',
      );
    }
  }
}
