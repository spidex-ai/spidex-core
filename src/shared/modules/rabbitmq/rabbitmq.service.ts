import { Inject, Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { CORE_MICROSERVICE } from "@shared/modules/rabbitmq/rabbitmq.constant";
import { firstValueFrom } from "rxjs";


@Injectable()
export class RabbitMQService implements OnApplicationBootstrap {

    private readonly logger = new Logger(RabbitMQService.name);
    constructor(
        @Inject(CORE_MICROSERVICE)
        private readonly coreClient: ClientProxy,
    ) { }

    async onApplicationBootstrap() {
        await Promise.all([
            this.coreClient.connect(),
        ]);

        this.logger.log('RabbitMQ connected');
    }



    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async emitToCore<T>(event: string, data: T) {
        return await firstValueFrom(this.coreClient.emit(event, data));
    }

}
