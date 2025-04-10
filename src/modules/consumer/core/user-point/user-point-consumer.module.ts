import { UserPointConsumerController } from "@modules/consumer/core/user-point/user-point-consumer.controller";
import { UserPointConsumerService } from "@modules/consumer/core/user-point/user-point-consumer.service";
import { UserPointModule } from "@modules/user-point/user-point.module";
import { UserModule } from "@modules/user/user.module";
import { Module } from "@nestjs/common";


@Module({
  imports: [UserModule, UserPointModule,],
  controllers: [UserPointConsumerController],
  providers: [UserPointConsumerService],
})
export class UserPointConsumerModule { }
