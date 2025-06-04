import { UserQuestConsumerController } from '@modules/consumer/core/user-quest/user-quest-consumer.controller';
import { UserQuestConsumerService } from '@modules/consumer/core/user-quest/user-quest-consumer.service';
import { QuestModule } from '@modules/user-quest/quest.module';
import { UserModule } from '@modules/user/user.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [UserModule, QuestModule],
  controllers: [UserQuestConsumerController],
  providers: [UserQuestConsumerService],
})
export class UserQuestConsumerModule {}
