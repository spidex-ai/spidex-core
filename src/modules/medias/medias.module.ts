import { Module } from '@nestjs/common';
import { S3Service } from 'external/aws/s3/s3.service';
import { MediasController } from './medias.controller';
import { MediasService } from './medias.service';

@Module({
  controllers: [MediasController],
  providers: [MediasService, S3Service],
})
export class MediasModule { }
