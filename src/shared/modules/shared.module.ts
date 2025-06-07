import { Global, Module } from '@nestjs/common';
import { LoggingModule } from '@shared/modules/loggers/logger.module';
import { RabbitMQModule } from '@shared/modules/rabbitmq/rabbitmq.module';
import { RedisModule } from '@shared/modules/redis/redis.module';
import { ConfigurationModule } from 'config/config.module';
import { DatabaseModule } from 'config/database.module';
import { CustomizeRedisModule } from 'config/redis.module';
import { BullQueueModule } from './bull-queue/bull-queue.module';
@Global()
@Module({
  imports: [
    ConfigurationModule,
    DatabaseModule,
    CustomizeRedisModule,
    RedisModule,
    LoggingModule,
    RabbitMQModule,
    BullQueueModule,
  ],
})
export class SharedModule {}
