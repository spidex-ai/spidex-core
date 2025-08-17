import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DHAPIService } from 'external/dhapi/dhapi.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.get<string>('DHAPI_API_URL'),
        headers: {
          'X-Partner-Id': configService.get<string>('DHAPI_PARTNER_ID'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [DHAPIService],
  exports: [DHAPIService],
})
export class DHAPIModule {}
