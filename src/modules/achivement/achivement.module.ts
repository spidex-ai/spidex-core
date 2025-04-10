import { Module } from "@nestjs/common";
import { CustomRepositoryModule } from "nestjs-typeorm-custom-repository";
import { AchievementRepository } from "@database/repositories/achievement.repository";
import { UserAchievementRepository } from "@database/repositories/user-achievement.repository";
import { AchievementController } from "./controllers/achievement.controller";
import { AchievementService } from "./services/achievement.service";
import { forwardRef } from "@nestjs/common";
import { UserPointModule } from "@modules/user-point/user-point.module";

@Module({
    imports: [
        CustomRepositoryModule.forFeature([AchievementRepository, UserAchievementRepository]),
        forwardRef(() => UserPointModule)
    ],
    controllers: [AchievementController],
    providers: [AchievementService],
    exports: [AchievementService]
})
export class AchievementModule { }
