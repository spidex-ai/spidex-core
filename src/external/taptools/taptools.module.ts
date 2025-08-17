import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TaptoolsService } from './taptools.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.get('TAPTOOLS_API_URL'),
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': configService.get('TAPTOOLS_API_KEY'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [TaptoolsService],
  exports: [TaptoolsService],
})
export class TaptoolsModule {}
