import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CardexscanService } from './cardexscan.service';
import { EEnvKey } from '@constants/env.constant';
import { BlockfrostModule } from 'external/blockfrost/blockfrost.module';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.get<string>(EEnvKey.CARDEXSCAN_API_URL),
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': `${configService.get<string>(EEnvKey.CARDEXSCAN_API_KEY)}`,
        },
        timeout: 30000,
      }),
      inject: [ConfigService],
    }),
    BlockfrostModule,
  ],
  providers: [CardexscanService],
  exports: [CardexscanService],
})
export class CardexscanModule {}
