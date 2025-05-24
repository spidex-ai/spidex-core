import { UserQuestConsumerService } from "@modules/consumer/core/user-quest/user-quest-consumer.service";
import { IQuestRelatedToTradeEvent } from "@modules/user-quest/interfaces/event-message";
import { USER_QUEST_EVENT_PATTERN } from "@modules/user-quest/interfaces/event-pattern";
import { Controller, Logger } from "@nestjs/common";
import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices";
import { IDeadLetterMessage } from "@shared/dtos/dead-letter-queue.dto";


@Controller()
export class UserQuestConsumerController {
  private readonly logger = new Logger(UserQuestConsumerController.name)
  constructor(
    private readonly userQuestConsumerService: UserQuestConsumerService
  ) { }

  @EventPattern(USER_QUEST_EVENT_PATTERN.QUEST_RELATED_TO_TRADE)
  async handleQuestRelatedToTradeEvent(@Payload() data: IQuestRelatedToTradeEvent, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      await this.userQuestConsumerService.handleQuestRelatedToTradeEvent(context, data)
    } catch (error) {
      this.logger.error(`Error handling quest related to trade event: ${error}`, error)

      const deadLetterMessage: IDeadLetterMessage<IQuestRelatedToTradeEvent> = {
        key: data.userId.toString(),
        message: data,
        deadLetterReason: (error as Error).message,
        stack: (error as Error).stack,
        retryCount: 0,
      };

      // Send to dead letter queue
      await this.userQuestConsumerService.handleQuestRelatedToTradeEventDeadLetter(context, deadLetterMessage);
    }

    await channel.ack(originalMsg);
  }

  @EventPattern(USER_QUEST_EVENT_PATTERN.DEAD_LETTER.QUEST_RELATED_TO_TRADE)
  async handleQuestRelatedToTradeEventDeadLetter(
    @Payload() message: IDeadLetterMessage<IQuestRelatedToTradeEvent>,
    @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      await this.userQuestConsumerService.handleQuestRelatedToTradeEventDeadLetterRetry(context, message);
    } catch (error) {
      this.logger.error(`Error handling quest related to chat with ai event dead letter: ${error}`, error)
      message.deadLetterReason = (error as Error).message
      message.stack = (error as Error).stack
      message.retryCount++
      await this.userQuestConsumerService.handleQuestRelatedToTradeEventDeadLetter(context, message);
    }
    await channel.ack(originalMsg);
  }

}