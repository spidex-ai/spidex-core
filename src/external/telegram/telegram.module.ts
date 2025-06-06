import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegramVerificationService } from './telegram-verification.service';
import { TelegramOAuthService } from './telegram-oauth.service';

@Module({
  imports: [ConfigModule],
  providers: [TelegramVerificationService, TelegramOAuthService],
  exports: [TelegramVerificationService, TelegramOAuthService],
})
export class TelegramModule {}
