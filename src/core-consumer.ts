import { CoreConsumerModule } from '@modules/consumer/core/core-consumer.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { getRabbitMQConsumerConfig } from '@shared/modules/rabbitmq/rabbitmq.config';
import { CORE_QUEUE } from '@shared/modules/rabbitmq/rabbitmq.constant';
import { initializeTransactionalContext } from 'typeorm-transactional';



async function bootstrap() {
    initializeTransactionalContext();
    const app = await NestFactory.create(CoreConsumerModule, {
        logger: new Logger(bootstrap.name)
    });
    const config = app.get(ConfigService);
    app.connectMicroservice<MicroserviceOptions>(getRabbitMQConsumerConfig(CORE_QUEUE, config));
    await app.startAllMicroservices();
    await app.init()
}


bootstrap();


