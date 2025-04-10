import { UserAchievementEntity } from "@database/entities/user-achievement.entity";
import { Controller, Get, HttpStatus } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthUser } from "@shared/decorators/auth-user.decorator";
import { AuthUserGuard } from "@shared/decorators/auth.decorator";
import { IJwtPayload } from "@shared/interfaces/auth.interface";
import { AchievementService } from "../services/achievement.service";

@Controller('achievements')
@ApiTags('Achievements')
@ApiBearerAuth()
export class AchievementController {
    constructor(
        private readonly achievementService: AchievementService
    ) { }

    @Get('/me/achievements')
    @AuthUserGuard()
    @ApiOperation({ summary: 'Get user achievements' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Returns user achievements',
        type: [UserAchievementEntity]
    })
    getMyAchievements(@AuthUser() user: IJwtPayload) {
        return this.achievementService.getUserAchievements(user.userId);
    }

    @Get('/me/next-achievement')
    @AuthUserGuard()
    getNextAchievement(@AuthUser() user: IJwtPayload) {
        return this.achievementService.getNextAchievement(user.userId);
    }
} 