/* eslint-disable @typescript-eslint/no-unused-vars */
import { EQuestType } from '@database/entities/quest.entity';
import { EUserQuestStatus } from '@database/entities/user-quest.entity';
import { UserQuestRepository } from '@database/repositories/user-quest.repository';
import { UserPointService } from '@modules/user-point/services/user-point.service';
import { ISocialQuestVerifyEvent } from '@modules/user-quest/interfaces/event-message';
import { QuestService } from '@modules/user-quest/services/quest.service';
import { UserQuestService } from '@modules/user-quest/services/user-quest.service';
import { UserService } from '@modules/user/user.service';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { DiscordVerificationService } from 'external/discord/verification/discord-verification.service';
import { TelegramVerificationService } from 'external/telegram/verification/telegram-verification.service';
import { IsNull } from 'typeorm';

@Injectable()
export class UserQuestBackgroundService {
  private readonly logger = this.loggerService.getLogger(UserQuestBackgroundService.name);
  constructor(
    private userQuestRepository: UserQuestRepository,
    private questService: QuestService,
    private loggerService: LoggerService,

    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    private discordVerificationService: DiscordVerificationService,
    private telegramVerificationService: TelegramVerificationService,
    private userQuestService: UserQuestService,
  ) {}

  async getSocialQuestVerificationTimeout(questId: number): Promise<number> {
    const quest = await this.questService.getQuestById(questId);
    if (!quest) {
      this.logger.error(`Quest not found during verification: ${questId}`);
      return 0;
    }

    if ([EQuestType.JOIN_DISCORD, EQuestType.JOIN_TELEGRAM].includes(quest.type)) {
      return 0;
    }

    return 7000;
  }

  async handleSocialQuestVerifyEvent(data: ISocialQuestVerifyEvent): Promise<void> {
    // This method will be called after the delay to verify the social quest
    const quest = await this.questService.getQuestById(data.questId);
    if (!quest) {
      this.logger.error(`Quest not found during verification: ${data.questId}`);
      return;
    }

    // Get user info for verification
    const user = await this.userService.getUserById(data.userId);
    if (!user) {
      this.logger.error(`User not found during verification: ${data.userId}`);
      return;
    }

    const existingUserQuest = await this.userQuestRepository.findOne({
      where: {
        userId: data.userId,
        questId: data.questId,
        deletedAt: IsNull(),
      },
    });

    if (!existingUserQuest) {
      this.logger.error(`User quest not found during verification: ${data.userId}, ${data.questId}`);
      return;
    }

    if (existingUserQuest.status === EUserQuestStatus.COMPLETED) {
      this.logger.error(`User quest already completed during verification: ${data.userId}, ${data.questId}`);
      return;
    }

    // Perform actual verification based on quest type
    let isVerified = false;
    let verificationError = '';

    switch (quest.type) {
      case EQuestType.JOIN_DISCORD:
        if (user.discordId) {
          const discordResult = await this.discordVerificationService.verifyMembership(user.discordId);
          console.log('Discord verified: ', discordResult);
          isVerified = discordResult.isVerified;
          verificationError = discordResult.error || '';
          this.logger.log(
            `Discord verification for user ${data.userId}: ${isVerified ? 'SUCCESS' : 'FAILED'} - ${verificationError}`,
          );
        } else {
          verificationError = 'User has not linked Discord account';
          this.logger.warn(`Discord verification failed for user ${data.userId}: ${verificationError}`);
        }
        break;

      case EQuestType.JOIN_TELEGRAM:
        if (user.telegramId) {
          const telegramResult = await this.telegramVerificationService.verifyMembership(parseInt(user.telegramId));
          isVerified = telegramResult.isVerified;
          verificationError = telegramResult.error || '';
          this.logger.log(
            `Telegram verification for user ${data.userId}: ${isVerified ? 'SUCCESS' : 'FAILED'} - ${verificationError}`,
          );
        } else {
          verificationError = 'User has not linked Telegram account';
          this.logger.warn(`Telegram verification failed for user ${data.userId}: ${verificationError}`);
        }
        break;

      default:
        // For other social quests (SOCIAL, FOLLOW_X), we'll simulate verification for now
        isVerified = true;
        this.logger.log(`Social quest verification simulated for user ${data.userId}, quest ${data.questId}`);
        break;
    }

    if (isVerified) {
      await this.userQuestService.completeQuest(data.userId, quest, {
        userQuestId: existingUserQuest.id,
      });
      this.logger.log(`Social quest verification completed for user ${data.userId}, quest ${data.questId}`);
    } else {
      this.logger.warn(
        `Social quest verification failed for user ${data.userId}, quest ${data.questId}: ${verificationError}`,
      );
    }
  }
}
