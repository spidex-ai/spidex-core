import { UserQuestConsumerService } from "@modules/consumer/core/user-quest/user-quest-consumer.service";
import { IQuestRelatedToChatWithAiEvent } from "@modules/user-quest/interfaces/event-message";
import { USER_QUEST_EVENT_PATTERN } from "@modules/user-quest/interfaces/event-pattern";
import { Controller, Logger } from "@nestjs/common";
import { Ctx, EventPattern, KafkaContext, Payload } from "@nestjs/microservices";
import { IDeadLetterMessage } from "@shared/dtos/dead-letter-queue.dto";


@Controller()
export class UserQuestConsumerController {
  private readonly logger = new Logger(UserQuestConsumerController.name)
  constructor(
    private readonly userQuestConsumerService: UserQuestConsumerService
  ) { }

  @EventPattern(USER_QUEST_EVENT_PATTERN.QUEST_RELATED_TO_CHAT_WITH_AI)
  async handleQuestRelatedToChatWithAiEvent(@Payload() data: IQuestRelatedToChatWithAiEvent, @Ctx() context: KafkaContext) {
    try {
      await this.userQuestConsumerService.handleQuestRelatedToChatWithAiEvent(context, data)
    } catch (error) {
      this.logger.error(`Error handling quest related to chat with ai event: ${error}`, error)

      const deadLetterMessage: IDeadLetterMessage<IQuestRelatedToChatWithAiEvent> = {
        key: data.userId.toString(),
        message: data,
        deadLetterReason: (error as Error).message,
        stack: (error as Error).stack,
        retryCount: 0,
      };

      // Send to dead letter queue
      await this.userQuestConsumerService.handleQuestRelatedToChatWithAiEventDeadLetter(context, deadLetterMessage);
    }

    const { offset } = context.getMessage();
    const partition = context.getPartition();
    const topic = context.getTopic();
    const consumer = context.getConsumer();
    await consumer.commitOffsets([{ topic, partition, offset: `${Number(offset) + 1}` }]);
  }

  @EventPattern(USER_QUEST_EVENT_PATTERN.DEAD_LETTER.QUEST_RELATED_TO_CHAT_WITH_AI)
  async handleQuestRelatedToChatWithAiEventDeadLetter(
    @Payload() message: IDeadLetterMessage<IQuestRelatedToChatWithAiEvent>,
    @Ctx() context: KafkaContext) {
    const { offset } = context.getMessage();
    const partition = context.getPartition();
    const topic = context.getTopic();
    const consumer = context.getConsumer();
    try {
      await this.userQuestConsumerService.handleQuestRelatedToChatWithAiEventDeadLetterRetry(context, message);
    } catch (error) {
      this.logger.error(`Error handling quest related to chat with ai event dead letter: ${error}`, error)
      message.deadLetterReason = (error as Error).message
      message.stack = (error as Error).stack
      message.retryCount++
      await this.userQuestConsumerService.handleQuestRelatedToChatWithAiEventDeadLetterRetry(context, message);
    }
    await consumer.commitOffsets([{ topic, partition, offset: `${Number(offset) + 1}` }]);
  }

}