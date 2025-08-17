import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegramOAuthService } from './telegram-oauth.service';

@Module({
  imports: [ConfigModule],
  providers: [TelegramOAuthService],
  exports: [TelegramOAuthService],
})
export class TelegramOAuthModule {}
