import { UserPointLogEntity } from "@database/entities/user-point-log.entity";
import { UserPointEntity } from "@database/entities/user-point.entity";
import { UserPointLogRepository } from "@database/repositories/user-point-log.repository";
import { UserPointRepository } from "@database/repositories/user-point.repository";
import { AchievementService } from "@modules/achivement/services/achievement.service";
import { SwapService } from "@modules/swap/swap.service";
import { UserPointHistoryOutputDto, UserPointHistoryParamsDto } from "@modules/user-point/dtos/user-point-history.dto";
import { LeaderboardStatsOutputDto, LeaderboardUserOutputDto } from "@modules/user-point/dtos/user-point-leaderboard.dto";
import { UserPointInfoOutput, UserPointOutput } from "@modules/user-point/dtos/user-point-output.dto";
import { IUserPointChangeEvent } from "@modules/user-point/interfaces/event-message";
import { USER_POINT_EVENT_PATTERN } from "@modules/user-point/interfaces/event-pattern";
import { EUserPointType } from "@modules/user-point/user-point.constant";
import { UserReferralService } from "@modules/user-referral/user-referral.service";
import { UserService } from "@modules/user/user.service";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PageMetaDto, PaginationDto } from "@shared/dtos/page-meta.dto";
import { PageOptionsDto } from "@shared/dtos/page-option.dto";
import { PageDto } from "@shared/dtos/page.dto";
import { BusinessException } from "@shared/exception";
import { CORE_MICROSERVICE } from "@shared/modules/kafka/kafka.constant";
import { LoggerService } from "@shared/modules/loggers/logger.service";
import { RedisLockService } from "@shared/modules/redis/redis-lock.service";
import { LOCK_KEY_USER_POINT } from "@shared/modules/redis/redis.constant";
import { plainToInstanceCustom } from "@shared/utils/class-transform";
import BigNumber from "bignumber.js";
import { firstValueFrom } from "rxjs";
import { In } from "typeorm";
import { Transactional } from "typeorm-transactional";


@Injectable()
export class UserPointService {
  private logger = this.loggerService.getLogger('User Point Service');
  constructor(
    private readonly loggerService: LoggerService,
    private readonly userPointRepository: UserPointRepository,
    private readonly userPointLogRepository: UserPointLogRepository,

    private readonly redisLockService: RedisLockService,
    @Inject(CORE_MICROSERVICE)
    private readonly coreMicroservice: ClientProxy,

    @Inject(forwardRef(() => UserReferralService))
    private readonly userReferralService: UserReferralService,

    @Inject(forwardRef(() => AchievementService))
    private readonly achievementService: AchievementService,

    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,

    private readonly swapService: SwapService,
  ) {

  }

  async emitUserPointChangeEvent(event: IUserPointChangeEvent) {
    console.time('emitUserPointChangeEvent')
    await firstValueFrom(this.coreMicroservice.emit(USER_POINT_EVENT_PATTERN.USER_POINT_CHANGE, event));
    console.timeEnd('emitUserPointChangeEvent')
  }

  @Transactional()
  async handleUserPointChangeEvent(data: IUserPointChangeEvent) {
    const { type, } = data;
    switch (type) {
      case EUserPointType.CORE:
        await this.increasePoint(data);
        break;
      case EUserPointType.REFERRAL:
        await this.increasePoint(data);
        break;
      case EUserPointType.QUEST:
        await this.increasePoint(data);
        break;
    }
  }

  @Transactional()
  async increasePoint(
    data: IUserPointChangeEvent,
  ): Promise<{ point: UserPointEntity, pointLog: UserPointLogEntity }> {
    this.logger.log(`${this.increasePoint.name} was called`);

    const { userId, amount, type: pointType, logType, userQuestId, referralId, } = data;
    return this.redisLockService.withLock(
      LOCK_KEY_USER_POINT(userId, pointType),
      async () => {
        const point = await this.getOrCreatePoint(userId);
        const haveReferral = await this.userReferralService.getReferralByUserId(userId);
        let exactAmount = amount;
        if (haveReferral) {
          const referralRate = 10;
          exactAmount = new BigNumber(amount).plus(new BigNumber(amount).multipliedBy(referralRate).dividedBy(100)).toString();
        }


        const newAmount = new BigNumber(point.amount)
          .plus(exactAmount)
          .toString();


        point.amount = newAmount;
        const pointLog = this.userPointLogRepository.create({
          userId,
          amount: exactAmount,
          pointType,
          logType,
          userQuestId,
          referralId,
        });


        await Promise.all([
          this.userPointRepository.save(point),
          this.userPointLogRepository.save(pointLog),
        ]);

        if (referralId) {
          await this.userReferralService.addPoints(referralId, amount);
        }

        await this.achievementService.checkAndUnlockAchievements(userId);

        return {
          point,
          pointLog,
        };
      },
    );
  }

  @Transactional()
  async decreasePoint(
    data: IUserPointChangeEvent,
  ): Promise<{ point: UserPointEntity, pointLog: UserPointLogEntity }> {
    this.logger.log(`${this.decreasePoint.name} was called`);
    const { userId, amount, type: pointType, logType, userQuestId, referralId } = data;

    return this.redisLockService.withLock(
      LOCK_KEY_USER_POINT(userId, pointType),
      async () => {
        const point = await this.getOrCreatePoint(userId);
        const newAmount = new BigNumber(point.amount).minus(amount);

        if (newAmount.isLessThan(0)) {
          throw new BusinessException({
            message: 'Insufficient reward',
          });
        }
        point.amount = newAmount.toString();
        const pointLog = this.userPointLogRepository.create({
          userId,
          amount: new BigNumber(amount).negated().toString(),
          pointType,
          logType,
          userQuestId,
          referralId,
        });

        await Promise.all([
          this.userPointRepository.save(point),
          this.userPointLogRepository.save(pointLog),
        ]);
        return {
          point,
          pointLog,
        }
      },
    );
  }


  async getOrCreatePoint(
    userId: number,
  ): Promise<UserPointEntity> {
    let point = await this.userPointRepository
      .findOneBy({ userId });

    if (!point) {
      point = this.userPointRepository.create({
        userId,
        amount: '0',
      });

      await this.userPointRepository.save(point);
    }

    return point;
  }


  async getMyInfo(userId: number): Promise<UserPointInfoOutput> {
    const [point, referralInfo, achievements, nextAchievement, tradingVolume] = await Promise.all([
      this.getOrCreatePoint(userId),
      this.userReferralService.getReferralInfo(userId),
      this.achievementService.getUserAchievements(userId),
      this.achievementService.getNextAchievement(userId),
      this.swapService.getTradingVolume(userId),
    ]);



    return {
      point: plainToInstanceCustom(UserPointOutput, point),
      referralInfo,
      achievements,
      nextAchievement,
      tradingVolume,
    };
  }

  async getMyHistory(userId: number, query: UserPointHistoryParamsDto): Promise<PageDto<UserPointHistoryOutputDto>> {
    const { page, limit } = query;
    const { pointLogs, total } = await this.userPointLogRepository.getMyHistory(userId, page, limit);
    const result: UserPointHistoryOutputDto[] = pointLogs.map(e => {
      return {
        id: e.id,
        amount: e.amount,
        createdAt: e.createdAt,
        questName: e.userQuest?.quest?.name,
      }
    })

    return new PageDto(result, new PageMetaDto(total, new PageOptionsDto(page, limit)));
  }

  async getLeaderboard(userId: number, pagination: PaginationDto): Promise<PageDto<LeaderboardUserOutputDto>> {
    const user = await this.userService.getUserById(userId);
    const result = await this.userPointRepository.getLeaderboard(user, pagination);
    return new PageDto(result.data, result.meta);
  }

  async getMyRank(userId: number): Promise<LeaderboardUserOutputDto> {
    const user = await this.userService.getUserById(userId);
    const result = await this.userPointRepository.getUserRank(userId);
    return {
      rank: result.rank,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        address: user.walletAddress,
        email: user.email,
        xUsername: user.xUsername,
        fullName: user.fullName,
      },
      totalPoint: result.amount,
    }
  }

  async getLeadboardStats(): Promise<LeaderboardStatsOutputDto> {
    const result = await this.userPointRepository.getLeaderboardStats();
    return result;
  }

  async getPointLogsByReferralIds(referralIds: number[], page: number, limit: number): Promise<[UserPointLogEntity[], number]> {
    return this.userPointLogRepository.findAndCount({ where: { referralId: In(referralIds), }, relations: ['referral', 'referral.user'], skip: (page - 1) * limit, take: limit });
  }
}
