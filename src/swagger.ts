import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('App API')
  .setDescription('App API description')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

export function initSwagger(app: INestApplication, path?: string) {
  const configService = app.get(ConfigService);
  const document = SwaggerModule.createDocument(app, config);
  document.tags = [
    {
      name: configService.get('APP_NAME'),
      description: configService.get('APP_DESCRIPTION'),
    },
  ];
  SwaggerModule.setup(path, app, document);
}
