import { Module } from '@nestjs/common';
import { MediasController } from './medias.controller';
import { MediasService } from './medias.service';
import { AwsModule } from 'external/aws/aws.module';

@Module({
  imports: [AwsModule],
  controllers: [MediasController],
  providers: [MediasService],
})
export class MediasModule {}
