import { UserPointLogRepository } from "@database/repositories/user-point-log.repository";
import { UserPointRepository } from "@database/repositories/user-point.repository";
import { AchievementModule } from "@modules/achivement/achivement.module";
import { SwapModule } from "@modules/swap/swap.module";
import { UserPointController } from "@modules/user-point/controllers/user-point.controller";
import { UserPointService } from "@modules/user-point/services/user-point.service";
import { QuestModule } from "@modules/user-quest/quest.module";
import { UserReferralModule } from "@modules/user-referral/user-referral.module";
import { UserModule } from "@modules/user/user.module";
import { forwardRef, Module } from "@nestjs/common";
import { KafkaModule } from "@shared/modules/kafka/kafka.module";
import { CustomRepositoryModule } from "nestjs-typeorm-custom-repository";


@Module({
  imports: [CustomRepositoryModule.forFeature([
    UserPointRepository, UserPointLogRepository,
  ]), KafkaModule,
  forwardRef(() => QuestModule),
  forwardRef(() => UserReferralModule),
  forwardRef(() => AchievementModule),
  forwardRef(() => UserModule),
    SwapModule
  ],
  controllers: [UserPointController],
  providers: [UserPointService],
  exports: [UserPointService],
})
export class UserPointModule { }
