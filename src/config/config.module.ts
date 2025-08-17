import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validate } from '@shared/validations/env.validation';
import redisConfig from './redis.config';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      validate,
      load: [redisConfig],
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigurationModule {}
