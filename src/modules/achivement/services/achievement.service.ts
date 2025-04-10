import { UserAchievementEntity } from "@database/entities/user-achievement.entity";
import { AchievementRepository } from "@database/repositories/achievement.repository";
import { UserAchievementRepository } from "@database/repositories/user-achievement.repository";
import { AchievementOutput, NextAchievementOutput } from "@modules/achivement/dtos/achivement-output.dto";
import { UserPointService } from "@modules/user-point/services/user-point.service";
import { Inject, Injectable, forwardRef } from "@nestjs/common";
import { LoggerService } from "@shared/modules/loggers/logger.service";
import { plainToInstanceCustom } from "@shared/utils/class-transform";
import { BigNumber } from "bignumber.js";
import { Transactional } from "typeorm-transactional";

@Injectable()
export class AchievementService {
    private logger = this.loggerService.getLogger('AchievementService');

    constructor(
        private readonly loggerService: LoggerService,
        private readonly achievementRepository: AchievementRepository,
        private readonly userAchievementRepository: UserAchievementRepository,
        @Inject(forwardRef(() => UserPointService))
        private readonly userPointService: UserPointService,
    ) { }

    @Transactional()
    async checkAndUnlockAchievements(userId: number): Promise<UserAchievementEntity[]> {
        const userPoint = await this.userPointService.getOrCreatePoint(userId);
        const userPoints = parseFloat(userPoint.amount);

        // Get all achievements user hasn't unlocked yet
        const unlockedAchievements = await this.achievementRepository.findUnlockedAchievements(userPoints);
        const existingUserAchievements = await this.userAchievementRepository.findUserAchievements(userId);
        const existingAchievementIds = existingUserAchievements.map(ua => ua.achievementId);
        // Filter out already unlocked achievements
        const newAchievements = unlockedAchievements.filter(
            achievement => !existingAchievementIds.includes(achievement.id)
        );

        // Create user achievements for newly unlocked achievements
        const newUserAchievements = await Promise.all(
            newAchievements.map(achievement =>
                this.userAchievementRepository.save({
                    userId,
                    achievementId: achievement.id,
                    unlockedAt: new Date()
                })
            )
        );

        return newUserAchievements;
    }

    async getNextAchievement(userId: number): Promise<NextAchievementOutput> {
        const userPoint = await this.userPointService.getOrCreatePoint(userId);
        const userPoints = parseFloat(userPoint.amount);
        const nextAchievement = await this.achievementRepository.findNextAchievement(userPoints);
        const nextAchievementOutput = plainToInstanceCustom(NextAchievementOutput, nextAchievement);
        nextAchievementOutput.pointsToNextAchievement = new BigNumber(nextAchievement.points).minus(userPoints).toString();
        return nextAchievementOutput;
    }

    async getUserAchievements(userId: number): Promise<AchievementOutput[]> {
        const userAchievements = await this.userAchievementRepository.findUserAchievements(userId);
        const achievementOutputs = userAchievements.map(achievement => plainToInstanceCustom(AchievementOutput, achievement.achievement));
        return achievementOutputs;
    }
} 