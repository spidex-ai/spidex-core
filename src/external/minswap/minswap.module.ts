import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MinswapService } from 'external/minswap/minswap.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.get<string>('MINSWAP_API_URL'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MinswapService],
  exports: [MinswapService],
})
export class MinswapModule {}
