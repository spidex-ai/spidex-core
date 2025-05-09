import { ConfigModule } from "@nestjs/config";
import { ConfigService } from "@nestjs/config";
import { BullModule } from '@nestjs/bullmq';
import { Module } from "@nestjs/common";
import { EEnvKey } from "@constants/env.constant";

@Module({
    imports: [
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
              connection: {
                host: configService.get(EEnvKey.REDIS_HOST),
                port: configService.get(EEnvKey.REDIS_PORT),
                password: configService.get(EEnvKey.REDIS_PASSWORD),
                keyPrefix: configService.get('REDIS_PREFIX'),
                db: configService.get(EEnvKey.REDIS_DB),
                sentinelMaxConnections: configService.get<number>(
                 'REDIS_SENTINEL_MAX_CONNECTIONS',
                  30,
                ),
              },
            }),
            inject: [ConfigService],
          })
    ],
})
export class BullQueueModule {}