import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { GuardModule } from '@shared/guards/guard.module';
import { LoggerHttpRequestMiddleware } from '@shared/middleware/logger.middleware';
import { SvgSecurityMiddleware } from '@shared/middleware/svg-security.middleware';
import { SharedModule } from '@shared/modules/shared.module';
import { ConsoleModule } from 'nestjs-console';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MODULES } from './modules';

@Module({
  imports: [
    SharedModule,
    GuardModule,
    ConsoleModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'src', 'public'),
      serveRoot: '/public',
    }),
    ScheduleModule.forRoot(),
    ...MODULES,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerHttpRequestMiddleware).forRoutes('*');
    consumer.apply(SvgSecurityMiddleware).forRoutes('*');
  }
}
