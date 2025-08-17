import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegramVerificationService } from 'external/telegram/verification/telegram-verification.service';

@Module({
  imports: [ConfigModule],
  providers: [TelegramVerificationService],
  exports: [TelegramVerificationService],
})
export class TelegramVerificationModule {}
