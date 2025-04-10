import { UserRepository } from '@database/repositories/user.repository';
import { UserReferralModule } from '@modules/user-referral/user-referral.module';
import { forwardRef, Module } from '@nestjs/common';
import { CustomRepositoryModule } from 'nestjs-typeorm-custom-repository';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    CustomRepositoryModule.forFeature([
      UserRepository,
    ]),
    forwardRef(() => UserReferralModule),
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule { }
