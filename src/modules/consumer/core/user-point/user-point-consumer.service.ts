import { IUserPointChangeEvent } from "@modules/user-point/interfaces/event-message";
import { USER_POINT_EVENT_PATTERN } from "@modules/user-point/interfaces/event-pattern";
import { UserPointService } from "@modules/user-point/services/user-point.service";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { ClientProxy, KafkaContext } from "@nestjs/microservices";
import { IDeadLetterMessage } from "@shared/dtos/dead-letter-queue.dto";
import { heartbeatWrapped } from "@shared/modules/kafka/kafka.config";
import { CORE_MICROSERVICE } from "@shared/modules/kafka/kafka.constant";
import { firstValueFrom } from "rxjs";


@Injectable()
export class UserPointConsumerService {
  private readonly logger = new Logger(UserPointConsumerService.name);

  constructor(
    private readonly userPointService: UserPointService,
    @Inject(CORE_MICROSERVICE)
    private readonly coreMicroservice: ClientProxy,
  ) { }

  async handleUserPointChangeEvent(context: KafkaContext, data: IUserPointChangeEvent) {
    await heartbeatWrapped(context, this.logger, 'handleUserPointChangeEvent', async () => {
      await this.userPointService.handleUserPointChangeEvent(data);
    });
  }

  async handleUserPointChangeEventDeadLetter(_: KafkaContext, message: IDeadLetterMessage<IUserPointChangeEvent>) {
    this.logger.error(message);
    await firstValueFrom(this.coreMicroservice.emit<IDeadLetterMessage<IUserPointChangeEvent>>(
      USER_POINT_EVENT_PATTERN.DEAD_LETTER.USER_POINT_CHANGE,
      {
        key: message.key,
        value: message
      }));
  }

  async handleUserPointChangeEventDeadLetterRetry(context: KafkaContext, deadLetterMessage: IDeadLetterMessage<IUserPointChangeEvent>) {
    const MAX_RETRY = 5;
    if (deadLetterMessage.retryCount > MAX_RETRY) {
      // TODO: send alert to telegram
      return;
    }
    await this.handleUserPointChangeEvent(context, deadLetterMessage.message);
  }
} 
