import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { DiscordVerificationService } from './discord-verification.service';
import { DiscordOAuthService } from './discord-oauth.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  providers: [DiscordVerificationService, DiscordOAuthService],
  exports: [DiscordVerificationService, DiscordOAuthService],
})
export class DiscordModule {}
