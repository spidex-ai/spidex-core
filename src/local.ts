import { CoreConsumerModule } from '@modules/consumer/core/core-consumer.module';
import { NestFactory } from '@nestjs/core';
import { DiscordVerificationService } from 'external/discord/verification/discord-verification.service';
// import { TelegramVerificationService } from 'external/telegram/verification/telegram-verification.service';

const bootstrap = async () => {
  const coreApp = await NestFactory.create(CoreConsumerModule);

  await coreApp.init();

  const discordVerification = coreApp.get(DiscordVerificationService);
  // const telegramVerification = coreApp.get(TelegramVerificationService);

  const resp = await discordVerification.verifyMembership('432885514920787969');

  console.log({ resp });

  // const telegramResp = await telegramVerification.verifyMembership(5071214045);

  // console.log({ telegramResp });
};

bootstrap();
