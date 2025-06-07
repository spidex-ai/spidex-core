import { EEnvKey } from '@constants/env.constant';
import { CacheModule, CacheStore } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisLockService } from '@shared/modules/redis/redis-lock.service';
import { redisStore } from 'cache-manager-redis-yet';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const store = await redisStore({
          socket: {
            host: configService.get(EEnvKey.REDIS_HOST),
            port: configService.get(EEnvKey.REDIS_PORT),
          },
        });

        return {
          store: store as unknown as CacheStore,
          ttl: 3 * 60000, // 3 minutes (milliseconds)
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [RedisLockService],
  exports: [RedisLockService],
})
export class RedisModule {}
