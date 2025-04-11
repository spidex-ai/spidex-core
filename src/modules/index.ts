
import { UserPointModule } from '@modules/user-point/user-point.module';
import { UserReferralModule } from '@modules/user-referral/user-referral.module';
import { RateLimiterModule } from '@shared/modules/rate-limiter/rate-limiter.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { QuestModule } from '@modules/user-quest/quest.module';
import { SwapModule } from '@modules/swap/swap.module';
import { TokenModule } from '@modules/token/token.module';
export const MODULES = [
  UserModule,
  AuthModule,
  RateLimiterModule,
  UserReferralModule,
  UserPointModule,
  QuestModule,
  SwapModule,
  TokenModule
];
