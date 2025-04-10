import { CoreConsumerModule } from '@modules/consumer/core/core-consumer.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { getKafkaConfig } from '@shared/modules/kafka/kafka.config';
import { CORE_GROUP_ID } from '@shared/modules/kafka/kafka.constant';
import { initializeTransactionalContext } from 'typeorm-transactional';



async function bootstrap() {
    initializeTransactionalContext();
    const app = await NestFactory.create(CoreConsumerModule, {
        logger: new Logger(bootstrap.name)
    });
    const config = app.get(ConfigService);
    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.KAFKA,
        options: {
            client: getKafkaConfig(config),
            consumer: {
                groupId: CORE_GROUP_ID,
            },
            run: {
                autoCommit: false,
            },
        },
    });
    await app.startAllMicroservices();
    await app.init()
}


bootstrap();


