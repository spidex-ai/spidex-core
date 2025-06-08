import { IQuestRelatedToTradeEvent, ISocialQuestVerifyEvent } from '@modules/user-quest/interfaces/event-message';
import { USER_QUEST_EVENT_PATTERN } from '@modules/user-quest/interfaces/event-pattern';
import { UserQuestBackgroundService } from '@modules/user-quest/services/user-quest-background.service';
import { UserQuestService } from '@modules/user-quest/services/user-quest.service';
import { Injectable, Logger } from '@nestjs/common';
import { RmqContext } from '@nestjs/microservices';
import { IDeadLetterMessage } from '@shared/dtos/dead-letter-queue.dto';
import { RabbitMQService } from '@shared/modules/rabbitmq/rabbitmq.service';

@Injectable()
export class UserQuestConsumerService {
  private readonly logger = new Logger(UserQuestConsumerService.name);

  constructor(
    private readonly userQuestService: UserQuestService,
    private readonly rabbitMQService: RabbitMQService,
    private readonly userQuestBackgroundService: UserQuestBackgroundService,
  ) {}

  async handleQuestRelatedToTradeEvent(_: RmqContext, data: IQuestRelatedToTradeEvent) {
    await this.userQuestService.handleQuestRelatedToTradeEvent(data);
  }

  async handleQuestRelatedToTradeEventDeadLetter(
    _: RmqContext,
    message: IDeadLetterMessage<IQuestRelatedToTradeEvent>,
  ) {
    this.logger.error(message);
    await this.rabbitMQService.emitToCore<IDeadLetterMessage<IQuestRelatedToTradeEvent>>(
      USER_QUEST_EVENT_PATTERN.DEAD_LETTER.QUEST_RELATED_TO_TRADE,
      message,
    );
  }

  async handleQuestRelatedToTradeEventDeadLetterRetry(
    context: RmqContext,
    deadLetterMessage: IDeadLetterMessage<IQuestRelatedToTradeEvent>,
  ) {
    const MAX_RETRY = 5;
    if (deadLetterMessage.retryCount > MAX_RETRY) {
      // TODO: send alert to telegram
      return;
    }
    await this.handleQuestRelatedToTradeEvent(context, deadLetterMessage.message);
  }

  async handleSocialQuestVerifyEvent(_: RmqContext, data: ISocialQuestVerifyEvent) {
    // Simulate 7 seconds verification delay
    const delayMs = 7000;

    this.logger.log(
      `Social quest verification started for user ${data.userId}, quest ${data.questId}. Will complete in ${delayMs}ms`,
    );

    // Use setTimeout to simulate the verification delay
    setTimeout(async () => {
      try {
        await this.userQuestBackgroundService.handleSocialQuestVerifyEvent(data);
      } catch (error) {
        this.logger.error(
          `Error completing social quest verification for user ${data.userId}, quest ${data.questId}:`,
          error,
        );
      }
    }, delayMs);
  }

  async handleSocialQuestVerifyEventDeadLetter(_: RmqContext, message: IDeadLetterMessage<ISocialQuestVerifyEvent>) {
    this.logger.error(message);
    await this.rabbitMQService.emitToCore<IDeadLetterMessage<ISocialQuestVerifyEvent>>(
      USER_QUEST_EVENT_PATTERN.DEAD_LETTER.SOCIAL_QUEST_VERIFY,
      message,
    );
  }

  async handleSocialQuestVerifyEventDeadLetterRetry(
    context: RmqContext,
    deadLetterMessage: IDeadLetterMessage<ISocialQuestVerifyEvent>,
  ) {
    const MAX_RETRY = 5;
    if (deadLetterMessage.retryCount > MAX_RETRY) {
      // TODO: send alert to telegram
      return;
    }
    await this.handleSocialQuestVerifyEvent(context, deadLetterMessage.message);
  }
}
