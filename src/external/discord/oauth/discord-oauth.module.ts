import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DiscordOAuthService } from 'external/discord/oauth/discord-oauth.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  providers: [DiscordOAuthService],
  exports: [DiscordOAuthService],
})
export class DiscordOAuthModule {}
