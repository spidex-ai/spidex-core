import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DiscordVerificationService } from 'external/discord/verification/discord-verification.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  providers: [DiscordVerificationService],
  exports: [DiscordVerificationService],
})
export class DiscordVerificationModule {}
