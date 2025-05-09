
import { Global, Module } from "@nestjs/common";
import { KafkaModule } from "@shared/modules/kafka/kafka.module";
import { LoggingModule } from "@shared/modules/loggers/logger.module";
import { RedisModule } from "@shared/modules/redis/redis.module";
import { ConfigurationModule } from "config/config.module";
import { DatabaseModule } from "config/database.module";
import { CustomizeRedisModule } from "config/redis.module";
import { BullQueueModule } from "./bull-queue/bull-queue.module";
@Global()
@Module({
    imports: [
        ConfigurationModule,
        DatabaseModule,
        CustomizeRedisModule,
        RedisModule,
        LoggingModule,
        KafkaModule,
        BullQueueModule,
    ],
})
export class SharedModule { }   