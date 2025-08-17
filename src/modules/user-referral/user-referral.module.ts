import { UserReferralRepository } from '@database/repositories/user-referral.repository';
import { UserPointModule } from '@modules/user-point/user-point.module';
import { QuestModule } from '@modules/user-quest/quest.module';
import { UserReferralController } from '@modules/user-referral/controllers/user-referral.controller';
import { UserReferralService } from '@modules/user-referral/user-referral.service';
import { UserModule } from '@modules/user/user.module';
import { forwardRef, Module } from '@nestjs/common';
import { CustomRepositoryModule } from 'nestjs-typeorm-custom-repository';

@Module({
  imports: [
    CustomRepositoryModule.forFeature([UserReferralRepository]),
    forwardRef(() => UserModule),
    forwardRef(() => UserPointModule),
    forwardRef(() => QuestModule),
  ],
  controllers: [UserReferralController],
  providers: [UserReferralService],
  exports: [UserReferralService],
})
export class UserReferralModule {}
