import { IEventRelatedTradeMessage, IEventStatusChangedMessage } from '@modules/event/interfaces/event-message';
import { EVENT_PATTERNS } from '@modules/event/interfaces/event-pattern';
import { EventService } from '@modules/event/services/event.service';
import { Injectable } from '@nestjs/common';
import { RmqContext } from '@nestjs/microservices';
import { IDeadLetterMessage } from '@shared/dtos/dead-letter-queue.dto';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { RabbitMQService } from '@shared/modules/rabbitmq/rabbitmq.service';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class EventConsumerService {
  private readonly logger = this.loggerService.getLogger(EventConsumerService.name);

  constructor(
    private loggerService: LoggerService,
    private rabbitMQService: RabbitMQService,
    private eventService: EventService,
  ) {}

  @Transactional()
  async handleTradeCompletedForEvent(data: IEventRelatedTradeMessage): Promise<void> {
    await this.eventService.handleTradeCompletedForEvent(data);
  }

  async handleEventRelatedTradeEventDeadLetter(_: RmqContext, message: IDeadLetterMessage<IEventRelatedTradeMessage>) {
    this.logger.error('Sending event related trade to dead letter queue', message);
    await this.rabbitMQService.emitToCore<IDeadLetterMessage<IEventRelatedTradeMessage>>(
      EVENT_PATTERNS.DEAD_LETTER.EVENT_RELATED_TRADE,
      message,
    );
  }

  async handleEventRelatedTradeEventDeadLetterRetry(
    _context: RmqContext,
    deadLetterMessage: IDeadLetterMessage<IEventRelatedTradeMessage>,
  ) {
    const MAX_RETRY = 5;
    if (deadLetterMessage.retryCount > MAX_RETRY) {
      this.logger.error('Max retry count exceeded for event related trade', {
        key: deadLetterMessage.key,
        retryCount: deadLetterMessage.retryCount,
        reason: deadLetterMessage.deadLetterReason,
      });
      // TODO: send alert to telegram
      return;
    }

    await this.handleTradeCompletedForEvent(deadLetterMessage.message);
  }

  async handleEventStatusChangedEventDeadLetter(
    _: RmqContext,
    message: IDeadLetterMessage<IEventStatusChangedMessage>,
  ) {
    this.logger.error('Sending event status changed to dead letter queue', message);
    await this.rabbitMQService.emitToCore<IDeadLetterMessage<IEventStatusChangedMessage>>(
      EVENT_PATTERNS.DEAD_LETTER.EVENT_STATUS_CHANGED,
      message,
    );
  }

  async handleEventStatusChangedEventDeadLetterRetry(
    _context: RmqContext,
    deadLetterMessage: IDeadLetterMessage<IEventStatusChangedMessage>,
  ) {
    const MAX_RETRY = 5;
    if (deadLetterMessage.retryCount > MAX_RETRY) {
      this.logger.error('Max retry count exceeded for event status changed', {
        key: deadLetterMessage.key,
        retryCount: deadLetterMessage.retryCount,
        reason: deadLetterMessage.deadLetterReason,
      });
      // TODO: send alert to telegram
      return;
    }

    // For now, just log the retry attempt as no specific handling is implemented
    this.logger.info('Retrying event status changed processing', {
      eventId: deadLetterMessage.message.eventId,
      fromStatus: deadLetterMessage.message.fromStatus,
      toStatus: deadLetterMessage.message.toStatus,
      retryCount: deadLetterMessage.retryCount,
    });
  }
}
