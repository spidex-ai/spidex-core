import { UserPointHistoryParamsDto } from '@modules/user-point/dtos/user-point-history.dto';
import { UserPointLeaderboardQueryDto } from '@modules/user-point/dtos/user-point-leaderboard.dto';
import { UserPointRankQueryDto } from '@modules/user-point/dtos/user-point-rank.dto';
import { UserPointService } from '@modules/user-point/services/user-point.service';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '@shared/decorators/auth-user.decorator';
import { AuthUserGuard, GuardPublicOrAuth } from '@shared/decorators/auth.decorator';
import { IJwtPayload } from '@shared/interfaces/auth.interface';

@ApiTags('User Point')
@ApiBearerAuth()
@Controller('user-point')
export class UserPointController {
  constructor(private readonly userPointService: UserPointService) {}

  @AuthUserGuard()
  @Get('/me/info')
  async getMyInfo(@AuthUser() user: IJwtPayload) {
    return this.userPointService.getMyInfo(user.userId);
  }

  @AuthUserGuard()
  @Get('/me/rank')
  async getMyRank(@AuthUser() user: IJwtPayload, @Query() query: UserPointRankQueryDto) {
    const rank = await this.userPointService.getMyRank(user.userId, query);
    return rank;
  }

  @AuthUserGuard()
  @Get('/me/history')
  async getMyHistory(@AuthUser() user: IJwtPayload, @Query() query: UserPointHistoryParamsDto) {
    return this.userPointService.getMyHistory(user.userId, query);
  }

  @AuthUserGuard()
  @Get('/leaderboard')
  async getLeaderboard(@Query() query: UserPointLeaderboardQueryDto) {
    return this.userPointService.getLeaderboard(query);
  }

  @GuardPublicOrAuth()
  @Get('/leaderboard/stats')
  async getLeaderboardStats() {
    return this.userPointService.getLeadboardStats();
  }

  // @GuardPublicOrAuth()
  // @Get('/leaderboard')
  // async getLeaderboard(
  //   @AuthUser() user: IJwtPayload,
  //   @Query() query: UserPointLeaderboardParamsDto,) {
  //   const leaderboard = await this.userPointService.getLeaderboard(user, query,)
  //   return leaderboard
  // }
}
