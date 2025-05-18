import { IQuestRelatedToTradeEvent } from "@modules/user-quest/interfaces/event-message";
import { USER_QUEST_EVENT_PATTERN } from "@modules/user-quest/interfaces/event-pattern";
import { UserQuestService } from "@modules/user-quest/services/user-quest.service";
import { Injectable, Logger } from "@nestjs/common";
import { KafkaContext } from "@nestjs/microservices";
import { IDeadLetterMessage } from "@shared/dtos/dead-letter-queue.dto";
import { RabbitMQService } from "@shared/modules/rabbitmq/rabbitmq.service";


@Injectable()
export class UserQuestConsumerService {
  private readonly logger = new Logger(UserQuestConsumerService.name);

  constructor(
    private readonly userQuestService: UserQuestService,
    private readonly rabbitMQService: RabbitMQService,
  ) { }

  async handleQuestRelatedToTradeEvent(_: KafkaContext, data: IQuestRelatedToTradeEvent) {
    await this.userQuestService.handleQuestRelatedToTradeEvent(data);
  }

  async handleQuestRelatedToTradeEventDeadLetter(_: KafkaContext, message: IDeadLetterMessage<IQuestRelatedToTradeEvent>) {
    this.logger.error(message);
    await this.rabbitMQService.emitToCore<IDeadLetterMessage<IQuestRelatedToTradeEvent>>(
      USER_QUEST_EVENT_PATTERN.DEAD_LETTER.QUEST_RELATED_TO_TRADE,
      message
    );
  }

  async handleQuestRelatedToTradeEventDeadLetterRetry(context: KafkaContext, deadLetterMessage: IDeadLetterMessage<IQuestRelatedToTradeEvent>) {
    const MAX_RETRY = 5;
    if (deadLetterMessage.retryCount > MAX_RETRY) {
      // TODO: send alert to telegram
      return;
    }
    await this.handleQuestRelatedToTradeEvent(context, deadLetterMessage.message);
  }
} 
