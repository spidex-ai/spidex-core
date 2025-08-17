import { EQuestCategory, EQuestType } from '@database/entities/quest.entity';
import { UserReferralEntity } from '@database/entities/user-referral.entity';
import { UserReferralRepository } from '@database/repositories/user-referral.repository';
import { UserPointService } from '@modules/user-point/services/user-point.service';
import { QuestService } from '@modules/user-quest/services/quest.service';
import { UserQuestService } from '@modules/user-quest/services/user-quest.service';
import { CreateUserReferralInput } from '@modules/user-referral/dtos/create-user-referral.dto';
import { ReferralInfoOutput } from '@modules/user-referral/dtos/user-referral-info.dto';
import { ReferralHistoryOutput, UserReferredInfoOutput } from '@modules/user-referral/dtos/user-referred-info.dto';
import { UserService } from '@modules/user/user.service';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { PageMetaDto, PaginationDto } from '@shared/dtos/page-meta.dto';
import { PageOptionsDto } from '@shared/dtos/page-option.dto';
import { PageDto } from '@shared/dtos/page.dto';
import { plainToInstancesCustom } from '@shared/utils/class-transform';
import BigNumber from 'bignumber.js';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class UserReferralService {
  constructor(
    private readonly referralRepository: UserReferralRepository,
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
    @Inject(forwardRef(() => UserPointService)) private readonly userPointService: UserPointService,
    @Inject(forwardRef(() => QuestService)) private readonly questService: QuestService,
    @Inject(forwardRef(() => UserQuestService)) private readonly userQuestService: UserQuestService,
  ) {}

  @Transactional()
  async create(input: CreateUserReferralInput): Promise<UserReferralEntity> {
    const referral = this.referralRepository.create(input);
    const savedReferral = await this.referralRepository.save(referral);

    const quests = await this.questService.getQuestInType([EQuestType.REFER_FRIEND]);
    await Promise.all(
      quests.map(async quest => {
        switch (quest.category) {
          case EQuestCategory.ONE_TIME:
            const canCompleteOneTime = await this.userQuestService.canCompleteOneTimeQuest(
              savedReferral.referredBy,
              quest.id,
            );
            if (canCompleteOneTime) {
              await this.userQuestService.completeQuest(savedReferral.referredBy, quest, {
                referralId: savedReferral.id,
              });
            }
            break;
          case EQuestCategory.DAILY:
            const canCompleteDaily = await this.userQuestService.canCompleteDailyQuest(
              savedReferral.referredBy,
              quest.id,
            );
            if (canCompleteDaily) {
              await this.userQuestService.completeQuest(savedReferral.referredBy, quest, {
                referralId: savedReferral.id,
              });
            }
            break;
          case EQuestCategory.MULTI_TIME:
            const canCompleteMultiTime = await this.userQuestService.canCompleteMultiTimeQuest(
              savedReferral.referredBy,
              quest.id,
            );
            if (canCompleteMultiTime) {
              await this.userQuestService.completeQuest(savedReferral.referredBy, quest, {
                referralId: savedReferral.id,
              });
            }
            break;
        }
      }),
    );
    return savedReferral;
  }

  async getById(id: number): Promise<UserReferralEntity> {
    return this.referralRepository.findOne({ where: { id } });
  }

  async getReferralInfo(userId: number): Promise<ReferralInfoOutput> {
    const [referralCode, referralUserCount, referralPointEarned] = await Promise.all([
      this.userService.getOrCreateReferralCode(userId),
      this.referralRepository.count({ where: { referredBy: userId } }),
      this.referralRepository.sum('points' as never, { referredBy: userId }),
    ]);

    return {
      referralCode,
      referralUserCount,
      referralPointEarned: referralPointEarned ?? 0,
    };
  }

  async getReferralByUserId(userId: number): Promise<UserReferralEntity> {
    const referral = await this.referralRepository.findOne({ where: { userId } });
    return referral;
  }

  async getReferralByReferee(userId: number): Promise<UserReferralEntity> {
    const referral = await this.referralRepository.findOne({ where: { referredBy: userId } });
    return referral;
  }

  async getReferredUsers(userId: number, pagination: PaginationDto): Promise<PageDto<UserReferredInfoOutput>> {
    const { page, limit } = pagination;
    const [users, total] = await this.referralRepository.findAndCount({
      where: { referredBy: userId },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
      order: {
        createdAt: 'DESC',
      },
    });

    const data = users.map(referred => {
      const output: UserReferredInfoOutput = {
        id: referred.user.id,
        username: referred.user.username,
        avatar: referred.user.avatar,
        totalReferralPointEarned: referred.points,
        createdAt: referred.createdAt,
      };

      return output;
    });

    return {
      data: plainToInstancesCustom(UserReferredInfoOutput, data),
      meta: new PageMetaDto(total, new PageOptionsDto(page, limit)),
    };
  }

  @Transactional()
  async addPoints(referralId: number, amount: string): Promise<void> {
    const referral = await this.getById(referralId);
    referral.points = new BigNumber(referral.points).plus(amount).toString();
    await this.referralRepository.save(referral);
  }

  async getReferralHistory(userId: number, pagination: PaginationDto): Promise<PageDto<ReferralHistoryOutput>> {
    const { page, limit } = pagination;
    const referralIds = await this.referralRepository.find({ where: { referredBy: userId } });
    const [userPointLogs, total] = await this.userPointService.getPointLogsByReferralIds(
      userId,
      referralIds.map(referral => referral.id),
      page,
      limit,
    );

    const data = userPointLogs.map(userPointLog => {
      if (userPointLog.referral.referredBy === userId) {
        const output: ReferralHistoryOutput = {
          id: userPointLog.referralId,
          username: userPointLog.referral.user.username,
          avatar: userPointLog.referral.user.avatar,
          point: userPointLog.amount,
          createdAt: userPointLog.createdAt,
        };
        return output;
      } else {
        return {
          id: userPointLog.referralId,
          username: userPointLog.referral.referredByUser.username,
          avatar: userPointLog.referral.referredByUser.avatar,
          point: userPointLog.amount,
          createdAt: userPointLog.createdAt,
        };
      }
    });

    return {
      data: plainToInstancesCustom(ReferralHistoryOutput, data),
      meta: new PageMetaDto(total, new PageOptionsDto(page, limit)),
    };
  }

  async getReferralCount(userId: number): Promise<number> {
    return this.referralRepository.count({ where: { referredBy: userId } });
  }
}
