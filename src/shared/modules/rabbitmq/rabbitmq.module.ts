import { Global, Module } from '@nestjs/common';
import { ClientsModule, RmqOptions } from '@nestjs/microservices';

import { ConfigService } from '@nestjs/config';
import { getRabbitMQProducerConfig } from '@shared/modules/rabbitmq/rabbitmq.config';
import { RabbitMQService } from '@shared/modules/rabbitmq/rabbitmq.service';
import { CORE_MICROSERVICE, CORE_QUEUE } from '@shared/modules/rabbitmq/rabbitmq.constant';

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync({
      clients: [
        {
          name: CORE_MICROSERVICE,
          useFactory: (config: ConfigService): RmqOptions => {
            const options = getRabbitMQProducerConfig(CORE_QUEUE, config);
            return options;
          },
          inject: [ConfigService],
        },
      ],
    }),
  ],
  providers: [RabbitMQService],
  exports: [RabbitMQService],
})
export class RabbitMQModule { }
