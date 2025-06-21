import { Module } from '@nestjs/common';
import { MediasController } from './medias.controller';
import { MediasService } from './medias.service';
import { AwsModule } from 'external/aws/aws.module';
import { SvgSanitizerService } from '@shared/services/svg-sanitizer.service';

@Module({
  imports: [AwsModule],
  controllers: [MediasController],
  providers: [MediasService, SvgSanitizerService],
})
export class MediasModule {}
