import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { initSwagger } from 'swagger';
import helmet from 'helmet';
import { connectRedisAdapter } from 'adapters/redis.adapter';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { ResponseTransformInterceptor } from '@shared/interceptors/response.interceptor';
import { HttpExceptionFilter } from '@shared/filters/http-exception.filters';
import { UnknownExceptionsFilter } from '@shared/filters/unknown-exception.filter';

import { initializeTransactionalContext } from 'typeorm-transactional';
import { ToChecksumAddressPipe } from '@shared/pipes/to-check-sum-address.pipe';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  initializeTransactionalContext();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const loggingService = app.get(LoggerService);
  const logger = loggingService.getLogger('Application');
  app.enableCors();

  app.setGlobalPrefix(configService.get<string>('APP_GLOBAL_PREFIX') || 'api');

  await connectRedisAdapter(app);

  // Swagger
  if (configService.get<string>('APP_SWAGGER_PATH')) {
    initSwagger(app, configService.get<string>('APP_SWAGGER_PATH'));
  }
  app.use(helmet());

  app.useGlobalFilters(new UnknownExceptionsFilter(loggingService));
  app.useGlobalFilters(new HttpExceptionFilter(loggingService));

  app.useGlobalInterceptors(new ResponseTransformInterceptor(loggingService));

  app.useGlobalPipes(new ToChecksumAddressPipe());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Enables transformation
      whitelist: true,
    }),
  );
  const appPort = configService.get<number>('APP_PORT') || 8000;
  await app.listen(appPort, () => {
    logger.info(`🚀🚀🚀 [${configService.get<string>('APP_NAME')}] backend is running on port ${appPort}`);
  });
}
bootstrap();
