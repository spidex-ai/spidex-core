import { Injectable } from '@nestjs/common';
import { S3Service } from 'external/aws/s3/s3.service';
import mime from 'mime-types';

@Injectable()
export class MediasService {
  constructor(
    private awsService: S3Service,
  ) { }

  async upload({ file }: { file: any }) {
    const url = await this.awsService.uploadS3(
      file.buffer,
      file.originalname,
      mime.lookup(file.originalname) as any,
      'images',
    );

    return url;
  }
}
