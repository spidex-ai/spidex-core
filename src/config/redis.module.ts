import { Global, Module } from '@nestjs/common';
import { RedisClientType } from 'redis';

import { createClientRedis } from '@shared/utils/redis';
import { RedisModule } from '@nestjs-modules/ioredis';
import * as process from 'process';

@Global()
@Module({
  imports: [
    RedisModule.forRoot({
      type: 'single',
      url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/${+process.env.REDIS_DB || 0}`,
    }),
  ],
  providers: [
    {
      provide: 'REDIS',
      useFactory: async (): Promise<RedisClientType> => {
        const client = createClientRedis();
        await client.connect();
        return client;
      },
    },
  ],
  exports: ['REDIS'],
})
export class CustomizeRedisModule {}
