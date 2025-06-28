import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PasswordEncoderModule } from '@shared/modules/password-encoder/password-encoder.module';
import { AdminRepository } from '@database/repositories/admin.repository';
import { QuestRepository } from '@database/repositories/quest.repository';
import { CustomRepositoryModule } from 'nestjs-typeorm-custom-repository';
import { ConfigService } from '@nestjs/config';
import { EEnvKey } from '@constants/env.constant';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { CRAWL_DOCS_QUEUE_NAME } from '@constants/queue.constant';
import { CrawlDocsRepository } from '@database/repositories/crawl-docs.repository';
import { AdminConsumer } from './admin.consumer';
import { AdminAnalyticsService } from './services/admin-analytics.service';
import { UserRepository } from '@database/repositories/user.repository';

@Module({
  imports: [
    CustomRepositoryModule.forFeature([AdminRepository, CrawlDocsRepository, QuestRepository, UserRepository]),
    PasswordEncoderModule,
    BullModule.registerQueue({
      name: CRAWL_DOCS_QUEUE_NAME,
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get(EEnvKey.JWT_ACCESS_TOKEN_SECRET),
        signOptions: {
          expiresIn: configService.get(EEnvKey.JWT_ACCESS_TOKEN_EXPIRATION_TIME),
        },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminConsumer, AdminAnalyticsService],
  exports: [AdminService, AdminAnalyticsService],
})
export class AdminModule {}
