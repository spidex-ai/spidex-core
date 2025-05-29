import { EError } from "@constants/error.constant";
import { EQuestCategory, EQuestStatus, EQuestType, ITradePartnerTokenRequirement, ITradeVolumeRequirement, QUEST_UNLIMITED, QuestEntity } from "@database/entities/quest.entity";
import { EUserPointLogType } from "@database/entities/user-point-log.entity";
import { UserQuestEntity } from "@database/entities/user-quest.entity";
import { UserPointLogRepository } from "@database/repositories/user-point-log.repository";
import { UserQuestRepository } from "@database/repositories/user-quest.repository";
import { SwapService } from "@modules/swap/swap.service";
import { IUserPointChangeEvent } from "@modules/user-point/interfaces/event-message";
import { UserPointService } from "@modules/user-point/services/user-point.service";
import { EUserPointType } from "@modules/user-point/user-point.constant";
import { EUserQuestStatus, GetCheckInListFilterDto, TriggerAgentQuestQueryDto, UserQuestFilterDto, UserQuestInfoOutput } from "@modules/user-quest/dtos/user-quest.dto";
import { IQuestRelatedToTradeEvent } from "@modules/user-quest/interfaces/event-message";
import { USER_QUEST_EVENT_PATTERN } from "@modules/user-quest/interfaces/event-pattern";
import { IQuestRelatedToReferralOptions, IQuestRelatedToTradeOptions, TQuestOptions } from "@modules/user-quest/interfaces/type";
import { QuestService } from "@modules/user-quest/services/quest.service";
import { UserReferralService } from "@modules/user-referral/user-referral.service";
import { BadRequestException, forwardRef, Inject, Injectable } from "@nestjs/common";
import { PageMetaDto } from "@shared/dtos/page-meta.dto";
import { PageOptionsDto } from "@shared/dtos/page-option.dto";
import { PageDto } from "@shared/dtos/page.dto";
import { LoggerService } from "@shared/modules/loggers/logger.service";
import { RabbitMQService } from "@shared/modules/rabbitmq/rabbitmq.service";
import { getEndOfDay, getStartOfDay } from "@shared/utils/dayjs";
import { isNullOrUndefined } from "@shared/utils/util";
import Decimal from "decimal.js";
import { flattenDeep, groupBy, orderBy } from "lodash";
import { And, In, IsNull, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { Transactional } from "typeorm-transactional";
import { get } from "lodash";



@Injectable()
export class UserQuestService {
  private readonly logger = this.loggerService.getLogger(UserQuestService.name)
  constructor(
    private userQuestRepository: UserQuestRepository,
    @Inject(forwardRef(() => UserPointService))
    private userPointService: UserPointService,
    private rabbitMQService: RabbitMQService,
    private questService: QuestService,
    private loggerService: LoggerService,
    @Inject(forwardRef(() => UserReferralService))
    private userReferralService: UserReferralService,
    private userPointLogRepository: UserPointLogRepository,
    @Inject(forwardRef(() => SwapService))
    private swapService: SwapService,
  ) { }

  async checkIn(userId: number): Promise<void> {
    const quest = await this.questService.getQuestByType(EQuestType.DAILY_LOGIN)
    if (isNullOrUndefined(quest)) {
      throw new BadRequestException({
        validatorErrors: EError.QUEST_NOT_FOUND,
        message: `UserQuestService::checkIn() | Quest not found`,
      })
    }
    const canCompleteDaily = await this.canCompleteDailyQuest(userId, quest.id)
    if (!canCompleteDaily) {
      throw new BadRequestException({
        validatorErrors: EError.USER_QUEST_CHECK_IN_ALREADY_COMPLETED,
        message: `UserQuestService::checkIn() | User quest check in already completed`,
      })
    }
    await this.completeQuest(userId, quest)
  }

  async getCheckInList(userId: number, filter: GetCheckInListFilterDto): Promise<PageDto<UserQuestEntity>> {
    const { startDate, endDate } = filter
    const startOfDay = getStartOfDay(startDate)
    const endOfDay = getEndOfDay(endDate)
    const checkInList = await this.userQuestRepository.find({
      where: {
        userId, createdAt: And(LessThanOrEqual(endOfDay), MoreThanOrEqual(startOfDay)), deletedAt: IsNull(), quest: {
          type: EQuestType.DAILY_LOGIN
        }
      }
    })

    return new PageDto<UserQuestEntity>(checkInList, new PageMetaDto(checkInList.length, new PageOptionsDto(1, checkInList.length)))
  }

  async triggerSocialQuest(userId: number, questId: number): Promise<void> {
    const quest = await this.questService.getQuestById(questId)
    if (!quest) {
      throw new BadRequestException({
        validatorErrors: EError.QUEST_NOT_FOUND,
        message: `UserQuestService::triggerSocialQuest() | Quest not found`,
      })
    }

    if (quest.status !== EQuestStatus.ACTIVE) {
      throw new BadRequestException({
        validatorErrors: EError.QUEST_NOT_ACTIVE,
        message: `UserQuestService::triggerSocialQuest() | Quest not active`,
      })
    }

    const socialQuestTypes = [
      EQuestType.SOCIAL,
      EQuestType.JOIN_DISCORD,
      EQuestType.JOIN_TELEGRAM,
      EQuestType.FOLLOW_X,
    ]
    if (!socialQuestTypes.includes(quest.type)) {
      throw new BadRequestException({
        validatorErrors: EError.NOT_SOCIAL_QUEST,
        message: `UserQuestService::triggerSocialQuest() | Social interact quest not found`,
      })
    }

    if (quest.startDate && quest.startDate > new Date()) {
      throw new BadRequestException({
        validatorErrors: EError.QUEST_NOT_START,
        message: `UserQuestService::triggerSocialQuest() | Social interact quest not started`,
      })
    }

    if (quest.endDate && quest.endDate < new Date()) {
      throw new BadRequestException({
        validatorErrors: EError.QUEST_ALREADY_ENDED,
        message: `UserQuestService::triggerSocialQuest() | Social interact quest already ended`,
      })
    }

    switch (quest.category) {
      case EQuestCategory.ONE_TIME:
        const canCompleteOneTime = await this.canCompleteOneTimeQuest(userId, quest.id)
        if (!canCompleteOneTime) {
          throw new BadRequestException({
            validatorErrors: EError.USER_QUEST_ALREADY_COMPLETED,
            message: `UserQuestService::triggerSocialQuest() | User quest already completed`,
          })
        }
        await this.completeQuest(userId, quest)
        break
      case EQuestCategory.DAILY:
        const canCompleteDaily = await this.canCompleteDailyQuest(userId, quest.id)
        if (!canCompleteDaily) {
          throw new BadRequestException({
            validatorErrors: EError.USER_QUEST_ALREADY_COMPLETED,
            message: `UserQuestService::triggerSocialQuest() | User quest already completed`,
          })
        }
        await this.completeQuest(userId, quest)
        break
      case EQuestCategory.MULTI_TIME:
        const canCompleteMultiTime = await this.canCompleteMultiTimeQuest(userId, quest.id)
        if (!canCompleteMultiTime) {
          throw new BadRequestException({
            validatorErrors: EError.USER_QUEST_ALREADY_COMPLETED,
            message: `UserQuestService::triggerSocialQuest() | User quest already completed`,
          })
        }
        await this.completeQuest(userId, quest)
        break
    }
  }


  @Transactional()
  async completeQuest(userId: number, quest: QuestEntity, options?: TQuestOptions): Promise<void> {
    const referral = await this.userReferralService.getReferralByUserId(userId);
    const userQuest = this.userQuestRepository.create({
      userId,
      questId: quest.id,
      points: quest.points,
    });

    await this.userQuestRepository.save(userQuest);

    const shouldAddToReferralPoint = true

    let referralId = null
    if (shouldAddToReferralPoint && referral) {
      referralId = referral.id
    }
    const userPointChangeEvent: IUserPointChangeEvent = {
      userId,
      amount: quest.points.toString(),
      type: EUserPointType.QUEST,
      logType: EUserPointLogType.FROM_QUEST,
      userQuestId: userQuest.id,
      myReferralId: referralId,
      referralIdOfReferee: get<IQuestRelatedToReferralOptions>(options, 'referralId', null),
      plusToReferral: shouldAddToReferralPoint,
    };



    await this.userPointService.emitUserPointChangeEvent(userPointChangeEvent);
  }


  async canCompleteOneTimeQuest(userId: number, questId: number, options?: TQuestOptions): Promise<boolean> {
    const quest = await this.questService.getQuestById(questId)
    if (!quest) {
      this.logger.warn(`UserQuestService::canCompleteOneTimeQuest() | Quest not found`, { questId })
      return false
    }

    const userQuest = await this.userQuestRepository.findOne({ where: { userId, questId, deletedAt: IsNull() } });
    if (userQuest) {
      return false
    }

    return true
  }

  async canCompleteDailyQuest(userId: number, questId: number, options?: TQuestOptions): Promise<boolean> {
    const startOfDay = getStartOfDay(new Date());
    const endOfDay = getEndOfDay(new Date());
    const userQuest = await this.userQuestRepository.findOne({ where: { userId, questId, createdAt: And(LessThanOrEqual(endOfDay), MoreThanOrEqual(startOfDay)), deletedAt: IsNull() } });
    if (userQuest) {
      return false
    }

    const quest = await this.questService.getQuestById(questId)
    if (!quest) {
      this.logger.warn(`UserQuestService::canCompleteDailyQuest() | Quest not found`, { questId })
      return false
    }

    return true
  }

  async canCompleteMultiTimeQuest(userId: number, questId: number, options?: TQuestOptions): Promise<boolean> {
    const quest = await this.questService.getQuestById(questId)
    if (!quest) {
      this.logger.warn(`UserQuestService::canCompleteMultiTimeQuest() | Quest not found`, { questId })
      return false
    }
    if (quest.category !== EQuestCategory.MULTI_TIME) {
      this.logger.warn(`UserQuestService::canCompleteMultiTimeQuest() | Quest is not multi time`, { questId })
      return false
    }
    const limit = quest.limit
    const userQuest = await this.userQuestRepository.count({ where: { userId, questId, deletedAt: IsNull() } })

    if (userQuest >= limit) {
      if (limit !== QUEST_UNLIMITED) {
        this.logger.warn(`UserQuestService::canCompleteMultiTimeQuest() | User quest count is greater than limit`, { questId, userId, userQuest, limit })
        return false
      }
    }

    return true
  }

  async canCompleteQuestByType(userId: number, quest: QuestEntity, options?: TQuestOptions): Promise<boolean> {
    switch (quest.type) {
      case EQuestType.DAILY_TRADE:
        return this.canCompleteDailyTradeQuest(userId, quest)
      default:
        this.logger.warn(`UserQuestService::canCompleteQuestByType() | Quest type not found`, { questId: quest.id })
        return true
    }
  }


  async canCompleteDailyTradeQuest(userId: number, quest: QuestEntity,): Promise<boolean> {
    const startOfDay = getStartOfDay(new Date());
    const endOfDay = getEndOfDay(new Date());
    const userQuest = await this.userQuestRepository.findOne({ where: { userId, questId: quest.id, createdAt: And(LessThanOrEqual(endOfDay), MoreThanOrEqual(startOfDay)), deletedAt: IsNull() } })


    if (userQuest) {
      return false
    }
    return true
  }

  async canCompleteFirstTradeQuest(userId: number, quest: QuestEntity,): Promise<boolean> {
    const userQuest = await this.userQuestRepository.findOne({ where: { userId, questId: quest.id, deletedAt: IsNull() } })
    if (userQuest) {
      return false
    }
    return true
  }

  async canCompleteTradeVolumeQuest(userId: number, quest: QuestEntity, options?: TQuestOptions): Promise<boolean> {
    const userQuest = await this.userQuestRepository.findOne({ where: { userId, questId: quest.id, deletedAt: IsNull() } })
    if (userQuest) {
      return false
    }
    const tradeOptions = options as IQuestRelatedToTradeOptions
    const tx = await this.swapService.getSellSwapTransaction(tradeOptions.txHash)
    if (!tx) {
      return false
    }

    const requirements = quest.requirements as ITradeVolumeRequirement
    if (new Decimal(tx.totalUsd).lt(requirements.amount)) {
      return false
    }
    return true
  }

  async canCompleteTradePartnerTokenQuest(userId: number, quest: QuestEntity, options?: TQuestOptions): Promise<boolean> {
    const userQuest = await this.userQuestRepository.findOne({ where: { userId, questId: quest.id, deletedAt: IsNull() } })
    if (userQuest) {
      return false
    }
    const tradeOptions = options as IQuestRelatedToTradeOptions
    const txs = await this.swapService.getSwapTransactionByTxHash(tradeOptions.txHash)
    if (!txs || txs.length === 0) {
      return false
    }
    const requirements = quest.requirements as ITradePartnerTokenRequirement
    if (txs.some(tx => tx.tokenA === requirements.token || tx.tokenB === requirements.token)) {
      return true
    }
    return false
  }

  async canCompleteTotalTradeVolumeQuest(userId: number, quest: QuestEntity,): Promise<boolean> {
    const userQuest = await this.userQuestRepository.findOne({ where: { userId, questId: quest.id, deletedAt: IsNull() } })
    if (userQuest) {
      return false
    }
    const totalTradeVolume = await this.swapService.getTradingVolume(userId)
    const requirements = quest.requirements as ITradeVolumeRequirement
    if (totalTradeVolume < requirements.amount) {
      return false
    }
    return true
  }

  async getQuests(userId: number, filter: UserQuestFilterDto): Promise<PageDto<UserQuestInfoOutput>> {

    const { page, limit } = filter
    const allQuests = await this.questService.getQuests()

    const questByCategory = groupBy<QuestEntity>(allQuests, quest => quest.category);

    const userQuests = await Promise.all(Object.keys(questByCategory).map(async (category: string) => {

      const categoryEnum = +category as EQuestCategory;
      const questIds = questByCategory[category].map(quest => quest.id);
      return this.getUserQuestListByCategory(userId, categoryEnum, questIds);
    }))

    const flatUserQuests = flattenDeep(userQuests)
    const groupedUserQuests = groupBy<UserQuestEntity>(flatUserQuests, (quest: UserQuestEntity) => {
      return `${quest.questId}-${quest.quest.category}`
    });

    const userQuestOutputs: UserQuestInfoOutput[] = allQuests.map(quest => {
      let status = EUserQuestStatus.NOT_COMPLETED;
      const progress = {
        current: 0,
        target: 0,
      }
      const key = `${quest.id}-${quest.category}`
      switch (quest.category) {
        case EQuestCategory.ONE_TIME:
          status = groupedUserQuests[key] ? EUserQuestStatus.COMPLETED : EUserQuestStatus.NOT_COMPLETED;
          break;
        case EQuestCategory.DAILY:
          status = groupedUserQuests[key] ? EUserQuestStatus.COMPLETED : EUserQuestStatus.NOT_COMPLETED;
          break;
        case EQuestCategory.MULTI_TIME:
          const userQuests = groupedUserQuests[key]
          if (userQuests && userQuests.length >= quest.limit) {
            if (quest.limit === QUEST_UNLIMITED) {
              status = EUserQuestStatus.NOT_COMPLETED
            } else {
              status = EUserQuestStatus.COMPLETED
            }
            progress.current = userQuests.length
            progress.target = quest.limit
          }
          break;
      }
      return {
        id: quest.id,
        name: quest.name,
        createdAt: quest.createdAt,
        category: quest.category,
        requirements: quest.requirements,
        type: quest.type,
        point: quest.points,
        description: quest.description,
        status,
        progress
      }
    });

    const total = userQuestOutputs.length
    const paginatedUserQuestOutputs = orderBy(userQuestOutputs, [
      'type'
    ], ['DESC']).slice((page - 1) * limit, page * limit)

    return new PageDto<UserQuestInfoOutput>(paginatedUserQuestOutputs, new PageMetaDto(total, new PageOptionsDto(page, limit)))
  }

  private async getUserQuestListByCategory(userId: number, category: EQuestCategory, questIds: number[]) {
    switch (category) {
      case EQuestCategory.ONE_TIME:
        return this.getUserQuestOneTimeList(userId, questIds);
      case EQuestCategory.DAILY:
        return this.getUserQuestDailyList(userId, questIds);
      case EQuestCategory.MULTI_TIME:
        return this.getUserQuestMultiTimeList(userId, questIds);
      default:
        return [];
    }
  }

  async getUserQuestOneTimeList(userId: number, questIds: number[]): Promise<UserQuestEntity[]> {
    const userQuests = await this.userQuestRepository.find({ where: { userId, questId: In(questIds), deletedAt: IsNull() }, relations: ['quest'] });
    return userQuests
  }

  async getUserQuestDailyList(userId: number, questIds: number[]): Promise<UserQuestEntity[]> {
    const startOfDay = getStartOfDay(new Date());
    const endOfDay = getEndOfDay(new Date());
    const userQuests = await this.userQuestRepository.find({ where: { userId, questId: In(questIds), createdAt: And(LessThanOrEqual(endOfDay), MoreThanOrEqual(startOfDay)), deletedAt: IsNull() }, relations: ['quest'] });
    return userQuests
  }

  async getUserQuestMultiTimeList(userId: number, questIds: number[]): Promise<UserQuestEntity[]> {
    const userQuests = await this.userQuestRepository.find({ where: { userId, questId: In(questIds), deletedAt: IsNull() }, relations: ['quest'] });
    return userQuests
  }

  async emitUserQuestRelatedTradeEvent(data: IQuestRelatedToTradeEvent): Promise<void> {
    await this.rabbitMQService.emitToCore<IQuestRelatedToTradeEvent>(
      USER_QUEST_EVENT_PATTERN.QUEST_RELATED_TO_TRADE,
      data
    );
  }


  async handleQuestRelatedToTradeEvent(data: IQuestRelatedToTradeEvent): Promise<void> {
    const quests = await this.questService.getQuestInType([
      EQuestType.DAILY_TRADE,
    ])

    const options = {
      txHash: data.txHash,
    }

    console.log({
      quests,
      options,
    })

    await Promise.all(quests.map(async (quest) => {
      switch (quest.category) {
        case EQuestCategory.ONE_TIME:
          const canCompleteOneTime = await this.canCompleteOneTimeQuest(data.userId, quest.id, options);
          if (canCompleteOneTime) {
            await this.completeQuest(data.userId, quest);
          }
          break;
        case EQuestCategory.DAILY:
          const canCompleteDaily = await this.canCompleteDailyQuest(data.userId, quest.id, options);
          if (canCompleteDaily) {
            await this.completeQuest(data.userId, quest);
          }
          break;
        case EQuestCategory.MULTI_TIME:
          const canCompleteMultiTime = await this.canCompleteMultiTimeQuest(data.userId, quest.id, options);
          if (canCompleteMultiTime) {
            await this.completeQuest(data.userId, quest);
          }
          break;
      }
    }))
  }

  async triggerAgentQuest(userId: number, _: TriggerAgentQuestQueryDto): Promise<void> {
    const questTypes = [
      EQuestType.DAILY_PROMPT,
    ]
    const quests = await this.questService.getQuestInType(questTypes)


    await Promise.all(quests.map(async (quest) => {
      switch (quest.category) {
        case EQuestCategory.ONE_TIME:
          const canCompleteOneTime = await this.canCompleteOneTimeQuest(userId, quest.id,);
          if (canCompleteOneTime) {
            await this.completeQuest(userId, quest);
          }
          break;
        case EQuestCategory.DAILY:
          const canCompleteDaily = await this.canCompleteDailyQuest(userId, quest.id,);
          if (canCompleteDaily) {
            await this.completeQuest(userId, quest);
          }
          break;
        case EQuestCategory.MULTI_TIME:
          const canCompleteMultiTime = await this.canCompleteMultiTimeQuest(userId, quest.id,);
          if (canCompleteMultiTime) {
            await this.completeQuest(userId, quest);
          }
          break;
      }
    }))
  }
}

