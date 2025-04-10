import { QuestRepository } from "@database/repositories/quest.repository";
import { UserPointLogRepository } from "@database/repositories/user-point-log.repository";
import { UserQuestRepository } from "@database/repositories/user-quest.repository";
import { UserPointModule } from "@modules/user-point/user-point.module";
import { UserQuestController } from "@modules/user-quest/controllers/user-quest.controller";
import { QuestService } from "@modules/user-quest/services/quest.service";
import { UserQuestService } from "@modules/user-quest/services/user-quest.service";
import { UserReferralModule } from "@modules/user-referral/user-referral.module";
import { forwardRef, Module } from "@nestjs/common";
import { KafkaModule } from "@shared/modules/kafka/kafka.module";
import { CustomRepositoryModule } from "nestjs-typeorm-custom-repository";



@Module({
  imports: [CustomRepositoryModule.forFeature([
    UserQuestRepository, QuestRepository, UserPointLogRepository
  ]),
    KafkaModule,
  forwardRef(() => UserPointModule),
  forwardRef(() => UserReferralModule),
  ],
  providers: [UserQuestService, QuestService,],
  controllers: [UserQuestController,],
  exports: [QuestService, UserQuestService,],
})
export class QuestModule { }

