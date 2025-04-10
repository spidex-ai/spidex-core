import { UserPointConsumerService } from "@modules/consumer/core/user-point/user-point-consumer.service";
import { IUserPointChangeEvent } from "@modules/user-point/interfaces/event-message";
import { USER_POINT_EVENT_PATTERN } from "@modules/user-point/interfaces/event-pattern";
import { Controller, Logger } from "@nestjs/common";
import { Ctx, EventPattern, KafkaContext, Payload } from "@nestjs/microservices";
import { IDeadLetterMessage } from "@shared/dtos/dead-letter-queue.dto";


@Controller()
export class UserPointConsumerController {
  private readonly logger = new Logger(UserPointConsumerController.name)
  constructor(
    private readonly userPointConsumerService: UserPointConsumerService
  ) { }

  @EventPattern(USER_POINT_EVENT_PATTERN.USER_POINT_CHANGE)
  async handleUserPointChangeEvent(@Payload() data: IUserPointChangeEvent, @Ctx() context: KafkaContext) {
    try {
      await this.userPointConsumerService.handleUserPointChangeEvent(context, data)
    } catch (error) {
      this.logger.error(`Error handling user point change event: ${error}`, error)

      const deadLetterMessage: IDeadLetterMessage<IUserPointChangeEvent> = {
        key: data.userId.toString(),
        message: data,
        deadLetterReason: (error as Error).message,
        stack: (error as Error).stack,
        retryCount: 0,
      };

      // Send to dead letter queue
      await this.userPointConsumerService.handleUserPointChangeEventDeadLetter(context, deadLetterMessage);
    }

    const { offset } = context.getMessage();
    const partition = context.getPartition();
    const topic = context.getTopic();
    const consumer = context.getConsumer();
    await consumer.commitOffsets([{ topic, partition, offset: `${Number(offset) + 1}` }]);
  }

  @EventPattern(USER_POINT_EVENT_PATTERN.DEAD_LETTER.USER_POINT_CHANGE)
  async handleUserPointChangeEventDeadLetter(
    @Payload() message: IDeadLetterMessage<IUserPointChangeEvent>,
    @Ctx() context: KafkaContext) {
    const { offset } = context.getMessage();
    const partition = context.getPartition();
    const topic = context.getTopic();
    const consumer = context.getConsumer();
    try {
      await this.userPointConsumerService.handleUserPointChangeEventDeadLetterRetry(context, message);
    } catch (error) {
      this.logger.error(`Error handling user point change event dead letter: ${error}`, error)
      message.deadLetterReason = (error as Error).message
      message.stack = (error as Error).stack
      message.retryCount++
      await this.userPointConsumerService.handleUserPointChangeEventDeadLetterRetry(context, message);
    }
    await consumer.commitOffsets([{ topic, partition, offset: `${Number(offset) + 1}` }]);
  }
}
