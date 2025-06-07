import { HttpModule, HttpService } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { XApiHttpService } from './x-api.service';
import { EEnvKey } from '@constants/env.constant';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        baseURL: config.get(EEnvKey.X_BASE_URL),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    {
      provide: XApiHttpService,
      useExisting: HttpService,
    },
  ],
  exports: [XApiHttpService],
})
export class XApiModule {}
