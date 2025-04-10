import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { getKafkaConfig } from "@shared/modules/kafka/kafka.config";
import { CORE_GROUP_ID, CORE_MICROSERVICE } from "@shared/modules/kafka/kafka.constant";



@Global()
@Module({
  imports: [
    ClientsModule.registerAsync({
      clients: [
        {
          name: CORE_MICROSERVICE,
          useFactory: (config: ConfigService) => {
            return {
              transport: Transport.KAFKA,
              options: {
                client: getKafkaConfig(config),
                consumer: {
                  groupId: CORE_GROUP_ID,
                },
              },
            };
          },
          inject: [ConfigService],
        },
      ],
    })
  ],
  exports: [ClientsModule]
})
export class KafkaModule { }
