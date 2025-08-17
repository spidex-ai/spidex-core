import { EventConsumerModule } from '@modules/consumer/core/event/event-consumer.module';
import { UserPointConsumerModule } from '@modules/consumer/core/user-point/user-point-consumer.module';
import { UserQuestConsumerModule } from '@modules/consumer/core/user-quest/user-quest-consumer.module';
import { Module } from '@nestjs/common';
import { SharedModule } from '@shared/modules/shared.module';

@Module({
  imports: [SharedModule, UserPointConsumerModule, UserQuestConsumerModule, EventConsumerModule],
})
export class CoreConsumerModule {}
