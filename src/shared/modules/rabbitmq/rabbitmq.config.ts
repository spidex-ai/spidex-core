import { ConfigService } from '@nestjs/config';
import { RmqOptions, Transport } from '@nestjs/microservices';
import { split } from 'lodash';

export const getRabbitMQProducerConfig = (queue: string, config: ConfigService): RmqOptions => {
  const urls = config.get('RABBITMQ_URLS');
  return {
    transport: Transport.RMQ,
    options: {
      urls: split(urls, ','),
      queue: queue,
      queueOptions: {
        durable: true,
        autoDelete: false,
        arguments: {
          'x-single-active-consumer': true,
        },
      },
      noAck: true,
      persistent: true,
    },
  };
};

export const getRabbitMQConsumerConfig = (queue: string, config: ConfigService): RmqOptions => {
  const urls = config.get('RABBITMQ_URLS');
  return {
    transport: Transport.RMQ,
    options: {
      urls: split(urls, ','),
      queue: queue,
      queueOptions: {
        durable: true,
        autoDelete: false,
        arguments: {
          'x-single-active-consumer': true,
        },
      },
      noAck: false,
      persistent: true,
      prefetchCount: 1,
      socketOptions: {
        heartbeatIntervalInSeconds: 30,
      },
    },
  };
};
