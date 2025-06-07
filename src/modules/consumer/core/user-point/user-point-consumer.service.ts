import { IUserPointChangeEvent } from '@modules/user-point/interfaces/event-message';
import { USER_POINT_EVENT_PATTERN } from '@modules/user-point/interfaces/event-pattern';
import { UserPointService } from '@modules/user-point/services/user-point.service';
import { Injectable, Logger } from '@nestjs/common';
import { RmqContext } from '@nestjs/microservices';
import { IDeadLetterMessage } from '@shared/dtos/dead-letter-queue.dto';
import { RabbitMQService } from '@shared/modules/rabbitmq/rabbitmq.service';

@Injectable()
export class UserPointConsumerService {
  private readonly logger = new Logger(UserPointConsumerService.name);

  constructor(
    private readonly userPointService: UserPointService,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  async handleUserPointChangeEvent(context: RmqContext, data: IUserPointChangeEvent) {
    await this.userPointService.handleUserPointChangeEvent(data);
  }

  async handleUserPointChangeEventDeadLetter(_: RmqContext, message: IDeadLetterMessage<IUserPointChangeEvent>) {
    this.logger.error(message);
    await this.rabbitMQService.emitToCore<IDeadLetterMessage<IUserPointChangeEvent>>(
      USER_POINT_EVENT_PATTERN.DEAD_LETTER.USER_POINT_CHANGE,
      message,
    );
  }

  async handleUserPointChangeEventDeadLetterRetry(
    context: RmqContext,
    deadLetterMessage: IDeadLetterMessage<IUserPointChangeEvent>,
  ) {
    const MAX_RETRY = 5;
    if (deadLetterMessage.retryCount > MAX_RETRY) {
      // TODO: send alert to telegram
      return;
    }
    await this.handleUserPointChangeEvent(context, deadLetterMessage.message);
  }
}
