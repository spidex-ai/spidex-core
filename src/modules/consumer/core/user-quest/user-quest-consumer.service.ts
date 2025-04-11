import { IQuestRelatedToTradeEvent } from "@modules/user-quest/interfaces/event-message";
import { USER_QUEST_EVENT_PATTERN } from "@modules/user-quest/interfaces/event-pattern";
import { UserQuestService } from "@modules/user-quest/services/user-quest.service";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { ClientProxy, KafkaContext } from "@nestjs/microservices";
import { IDeadLetterMessage } from "@shared/dtos/dead-letter-queue.dto";
import { heartbeatWrapped } from "@shared/modules/kafka/kafka.config";
import { CORE_MICROSERVICE } from "@shared/modules/kafka/kafka.constant";
import { firstValueFrom } from "rxjs";


@Injectable()
export class UserQuestConsumerService {
  private readonly logger = new Logger(UserQuestConsumerService.name);

  constructor(
    private readonly userQuestService: UserQuestService,
    @Inject(CORE_MICROSERVICE)
    private readonly coreMicroservice: ClientProxy,
  ) { }

  async handleQuestRelatedToChatWithAiEvent(context: KafkaContext, data: IQuestRelatedToTradeEvent) {
    await heartbeatWrapped(context, this.logger, 'handleQuestRelatedToChatWithAiEvent', async () => {
      await this.userQuestService.handleQuestRelatedToChatWithAiEvent(data);
    });
  }

  async handleQuestRelatedToChatWithAiEventDeadLetter(_: KafkaContext, message: IDeadLetterMessage<IQuestRelatedToTradeEvent>) {
    this.logger.error(message);
    await firstValueFrom(this.coreMicroservice.emit<IDeadLetterMessage<IQuestRelatedToTradeEvent>>(
      USER_QUEST_EVENT_PATTERN.DEAD_LETTER.QUEST_RELATED_TO_CHAT_WITH_AI,
      {
        key: message.key,
        value: message
      }));
  }

  async handleQuestRelatedToChatWithAiEventDeadLetterRetry(context: KafkaContext, deadLetterMessage: IDeadLetterMessage<IQuestRelatedToTradeEvent>) {
    const MAX_RETRY = 5;
    if (deadLetterMessage.retryCount > MAX_RETRY) {
      // TODO: send alert to telegram
      return;
    }
    await this.handleQuestRelatedToChatWithAiEvent(context, deadLetterMessage.message);
  }
} 
