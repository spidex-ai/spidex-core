import { EUserPointLogType, UserPointLogEntity } from '@database/entities/user-point-log.entity';
import { UserPointEntity } from '@database/entities/user-point.entity';
import { EUserQuestStatus } from '@database/entities/user-quest.entity';
import { UserPointLogRepository } from '@database/repositories/user-point-log.repository';
import { UserPointRepository } from '@database/repositories/user-point.repository';
import { AchievementService } from '@modules/achivement/services/achievement.service';
import { SwapService } from '@modules/swap/swap.service';
import { SystemConfigService } from '@modules/system-config/system-config.service';
import { UserPointHistoryOutputDto, UserPointHistoryParamsDto } from '@modules/user-point/dtos/user-point-history.dto';
import {
  LeaderboardStatsOutputDto,
  LeaderboardUserOutputDto,
  UserPointLeaderboardQueryDto,
} from '@modules/user-point/dtos/user-point-leaderboard.dto';
import { UserPointInfoOutput, UserPointOutput } from '@modules/user-point/dtos/user-point-output.dto';
import { EUserPointRankOrderBy, UserPointRankQueryDto } from '@modules/user-point/dtos/user-point-rank.dto';
import { IUserPointChangeEvent } from '@modules/user-point/interfaces/event-message';
import { USER_POINT_EVENT_PATTERN } from '@modules/user-point/interfaces/event-pattern';
import { EUserPointType } from '@modules/user-point/user-point.constant';
import { UserQuestService } from '@modules/user-quest/services/user-quest.service';
import { UserReferralService } from '@modules/user-referral/user-referral.service';
import { UserService } from '@modules/user/user.service';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { PageMetaDto } from '@shared/dtos/page-meta.dto';
import { PageOptionsDto } from '@shared/dtos/page-option.dto';
import { PageDto } from '@shared/dtos/page.dto';
import { BusinessException } from '@shared/exception';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { RabbitMQService } from '@shared/modules/rabbitmq/rabbitmq.service';
import { RedisLockService } from '@shared/modules/redis/redis-lock.service';
import { LOCK_KEY_USER_POINT } from '@shared/modules/redis/redis.constant';
import { plainToInstanceCustom } from '@shared/utils/class-transform';
import BigNumber from 'bignumber.js';
import { IsNull, Not } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class UserPointService {
  private logger = this.loggerService.getLogger('User Point Service');
  constructor(
    private readonly loggerService: LoggerService,
    private readonly userPointRepository: UserPointRepository,
    private readonly userPointLogRepository: UserPointLogRepository,

    private readonly redisLockService: RedisLockService,
    private readonly rabbitMQService: RabbitMQService,

    @Inject(forwardRef(() => UserReferralService))
    private readonly userReferralService: UserReferralService,

    @Inject(forwardRef(() => AchievementService))
    private readonly achievementService: AchievementService,

    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,

    @Inject(forwardRef(() => SwapService))
    private readonly swapService: SwapService,

    @Inject(forwardRef(() => UserQuestService))
    private readonly userQuestService: UserQuestService,
    private readonly systemConfigService: SystemConfigService,
  ) {}

  async emitUserPointChangeEvent(event: IUserPointChangeEvent) {
    console.time('emitUserPointChangeEvent');
    await this.rabbitMQService.emitToCore(USER_POINT_EVENT_PATTERN.USER_POINT_CHANGE, event);
    console.timeEnd('emitUserPointChangeEvent');
  }

  @Transactional()
  async handleUserPointChangeEvent(data: IUserPointChangeEvent) {
    const { type, userId, amount, logType, userQuestId, myReferralId } = data;
    switch (type) {
      case EUserPointType.CORE:
      case EUserPointType.QUEST:
        const existsQuest = await this.userQuestService.getById(userId, userQuestId);
        if (!existsQuest || existsQuest.status !== EUserQuestStatus.COMPLETED) {
          this.logger.warn(`User quest with id ${userQuestId} does not exist`);
          return;
        }
        await this.increasePoint({
          type,
          userId,
          amount,
          logType,
          userQuestId,
          referralIdOfReferee: data.referralIdOfReferee,
          plusToReferral: data.plusToReferral,
        });
        if (myReferralId) {
          const referral = await this.userReferralService.getById(myReferralId);
          const referralRate = await this.systemConfigService.getReferralPointRate();
          const bonusPoint = new BigNumber(amount).multipliedBy(referralRate);

          await Promise.all([
            this.emitUserPointChangeEvent({
              logType: EUserPointLogType.FROM_REFERRAL,
              type: EUserPointType.REFERRAL,
              amount: bonusPoint.toString(),
              userId: referral.referredBy,
              myReferralId: referral.id,
              plusToReferral: true,
            }),

            this.emitUserPointChangeEvent({
              logType: EUserPointLogType.FROM_REFERRAL,
              type: EUserPointType.REFERRAL,
              amount: bonusPoint.toString(),
              userId: userId,
              myReferralId: referral.id,
            }),
          ]);
        }
        break;
      case EUserPointType.REFERRAL:
        await this.increasePoint(data);
        break;
    }
  }

  @Transactional()
  async increasePoint(data: IUserPointChangeEvent): Promise<{ point: UserPointEntity; pointLog: UserPointLogEntity }> {
    this.logger.log(`${this.increasePoint.name} was called`);
    const {
      userId,
      amount,
      type: pointType,
      logType,
      userQuestId,
      myReferralId: referralId,
      plusToReferral,
      referralIdOfReferee,
    } = data;

    console.log('increasePoint', { data });
    return this.redisLockService.withLock(LOCK_KEY_USER_POINT(userId, pointType), async () => {
      const point = await this.getOrCreatePoint(userId);
      const newAmount = new BigNumber(point.amount).plus(amount);
      point.amount = newAmount.toString();
      const pointLog = this.userPointLogRepository.create({
        userId,
        amount,
        pointType,
        logType,
      });
      if (userQuestId) {
        pointLog.userQuestId = userQuestId;
      }
      if (referralId) {
        pointLog.referralId = referralId;
      }

      if (referralIdOfReferee) {
        pointLog.referralId = referralIdOfReferee;
      }

      await Promise.all([this.userPointRepository.save(point), this.userPointLogRepository.save(pointLog)]);

      if (referralId && plusToReferral) {
        await this.userReferralService.addPoints(referralId, amount);
      }

      if (referralIdOfReferee && plusToReferral) {
        await this.userReferralService.addPoints(referralIdOfReferee, amount);
      }

      await this.achievementService.checkAndUnlockAchievements(userId);

      return {
        point,
        pointLog,
      };
    });
  }

  @Transactional()
  async decreasePoint(data: IUserPointChangeEvent): Promise<{ point: UserPointEntity; pointLog: UserPointLogEntity }> {
    this.logger.log(`${this.decreasePoint.name} was called`);
    const { userId, amount, type: pointType, logType, userQuestId, myReferralId: referralId } = data;

    return this.redisLockService.withLock(LOCK_KEY_USER_POINT(userId, pointType), async () => {
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

      await Promise.all([this.userPointRepository.save(point), this.userPointLogRepository.save(pointLog)]);
      return {
        point,
        pointLog,
      };
    });
  }

  async getOrCreatePoint(userId: number): Promise<UserPointEntity> {
    let point = await this.userPointRepository.findOneBy({ userId });

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
      let questName;
      switch (e.pointType) {
        case EUserPointType.QUEST:
          questName = e.userQuest?.quest?.name;
          break;
        case EUserPointType.REFERRAL:
          questName = 'From referral';
          break;
        case EUserPointType.CORE:
          questName = 'From trading';
          break;
        default:
          questName = 'Unknown';
      }

      return {
        id: e.id,
        amount: e.amount,
        createdAt: e.createdAt,
        questName: questName,
      };
    });

    return new PageDto(result, new PageMetaDto(total, new PageOptionsDto(page, limit)));
  }

  async getLeaderboard(query: UserPointLeaderboardQueryDto): Promise<LeaderboardUserOutputDto[]> {
    const result = await this.userPointRepository.getLeaderboard(query);
    return result;
  }

  async getMyRank(userId: number, query: UserPointRankQueryDto): Promise<LeaderboardUserOutputDto> {
    const user = await this.userService.getUserById(userId);
    const result = await this.userPointRepository.getUserRank(userId, query);
    const referralCount = await this.userReferralService.getReferralCount(userId);
    return {
      rank: result?.rank || -1,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        address: user.walletAddress,
        email: user.email,
        xUsername: user.xUsername,
        fullName: user.fullName,
      },
      totalPoint: result?.amount || '0',
      totalReferralCount: referralCount || 0,
    };
  }

  async getLeadboardStats(): Promise<LeaderboardStatsOutputDto> {
    const result = await this.userPointRepository.getLeaderboardStats();
    return result;
  }

  async getPointLogsByReferralIds(
    userId: number,
    referralIds: number[],
    page: number,
    limit: number,
  ): Promise<[UserPointLogEntity[], number]> {
    // pointType: EUserPointType.REFERRAL or referralId: Not(IsNull())
    return this.userPointLogRepository.findAndCount({
      where: [
        {
          userId,
          pointType: EUserPointType.REFERRAL,
        },
        {
          userId,
          referralId: Not(IsNull()),
        },
      ],
      relations: ['referral', 'referral.user', 'referral.referredByUser'],
      skip: (page - 1) * limit,
      take: limit,
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
