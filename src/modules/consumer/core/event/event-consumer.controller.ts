import { EventConsumerService } from './event-consumer.service';
import { IEventRelatedTradeMessage, IEventStatusChangedMessage } from '@modules/event/interfaces/event-message';
import { EVENT_PATTERNS } from '@modules/event/interfaces/event-pattern';
import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { IDeadLetterMessage } from '@shared/dtos/dead-letter-queue.dto';

@Controller()
export class EventConsumerController {
  private readonly logger = new Logger(EventConsumerController.name);
  constructor(private readonly eventConsumerService: EventConsumerService) {}

  @EventPattern(EVENT_PATTERNS.EVENT_RELATED_TRADE)
  async handleEventRelatedTradeEvent(@Payload() data: IEventRelatedTradeMessage, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      this.logger.log('Processing event related trade event', {
        userId: data.userId,
        txHash: data.txHash,
        tradeVolume: data.usdVolume,
      });

      await this.eventConsumerService.handleTradeCompletedForEvent(data);

      this.logger.log('Successfully processed event related trade', {
        userId: data.userId,
        txHash: data.txHash,
      });
    } catch (error) {
      this.logger.error(`Error handling event related trade event: ${error}`, error);

      const deadLetterMessage: IDeadLetterMessage<IEventRelatedTradeMessage> = {
        key: `${data.userId}_${data.txHash}`,
        message: data,
        deadLetterReason: (error as Error).message,
        stack: (error as Error).stack,
        retryCount: 0,
      };

      // Send to dead letter queue
      await this.eventConsumerService.handleEventRelatedTradeEventDeadLetter(context, deadLetterMessage);
    }
    await channel.ack(originalMsg);
  }

  @EventPattern(EVENT_PATTERNS.EVENT_STATUS_CHANGED)
  async handleEventStatusChangedEvent(@Payload() data: IEventStatusChangedMessage, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      this.logger.log('Processing event status changed event', {
        eventId: data.eventId,
        fromStatus: data.fromStatus,
        toStatus: data.toStatus,
        changedBy: data.changedBy,
      });

      // For now, just log the status change
      // Future implementations can handle specific logic for status changes
      this.logger.log('Event status changed successfully processed', {
        eventId: data.eventId,
        fromStatus: data.fromStatus,
        toStatus: data.toStatus,
      });
    } catch (error) {
      this.logger.error(`Error handling event status changed event: ${error}`, error);

      const deadLetterMessage: IDeadLetterMessage<IEventStatusChangedMessage> = {
        key: data.eventId.toString(),
        message: data,
        deadLetterReason: (error as Error).message,
        stack: (error as Error).stack,
        retryCount: 0,
      };

      // Send to dead letter queue
      await this.eventConsumerService.handleEventStatusChangedEventDeadLetter(context, deadLetterMessage);
    }
    await channel.ack(originalMsg);
  }

  // Dead letter handlers
  @EventPattern(EVENT_PATTERNS.DEAD_LETTER.EVENT_RELATED_TRADE)
  async handleEventRelatedTradeEventDeadLetter(
    @Payload() message: IDeadLetterMessage<IEventRelatedTradeMessage>,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      await this.eventConsumerService.handleEventRelatedTradeEventDeadLetterRetry(context, message);
    } catch (error) {
      this.logger.error(`Error handling event related trade dead letter: ${error}`, error);
      message.deadLetterReason = (error as Error).message;
      message.stack = (error as Error).stack;
      message.retryCount++;
      await this.eventConsumerService.handleEventRelatedTradeEventDeadLetterRetry(context, message);
    }
    await channel.ack(originalMsg);
  }

  @EventPattern(EVENT_PATTERNS.DEAD_LETTER.EVENT_STATUS_CHANGED)
  async handleEventStatusChangedEventDeadLetter(
    @Payload() message: IDeadLetterMessage<IEventStatusChangedMessage>,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      await this.eventConsumerService.handleEventStatusChangedEventDeadLetterRetry(context, message);
    } catch (error) {
      this.logger.error(`Error handling event status changed dead letter: ${error}`, error);
      message.deadLetterReason = (error as Error).message;
      message.stack = (error as Error).stack;
      message.retryCount++;
      await this.eventConsumerService.handleEventStatusChangedEventDeadLetterRetry(context, message);
    }
    await channel.ack(originalMsg);
  }
}
