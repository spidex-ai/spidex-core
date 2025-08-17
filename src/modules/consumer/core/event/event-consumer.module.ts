import { EventModule } from '@modules/event/event.module';
import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@shared/modules/rabbitmq/rabbitmq.module';
import { EventConsumerController } from './event-consumer.controller';
import { EventConsumerService } from './event-consumer.service';

@Module({
  imports: [EventModule, RabbitMQModule],
  controllers: [EventConsumerController],
  providers: [EventConsumerService],
  exports: [EventConsumerService],
})
export class EventConsumerModule {}
