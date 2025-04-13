import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { EEnvKey } from '@constants/env.constant';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
    private s3Client: S3Client;
    private bucket: string;
    private region: string; // Store the region

    constructor(private readonly configService: ConfigService) {
        this.region = configService.get(EEnvKey.S3_REGION);
        this.bucket = configService.get(EEnvKey.S3_BUCKET);

        const s3Config = {
            credentials: {
                accessKeyId: configService.get(EEnvKey.S3_ACCESS_KEY_ID),
                secretAccessKey: configService.get(EEnvKey.S3_SECRET_ACCESS_KEY),
            },
            region: this.region || 'auto',
            endpoint: `${configService.get(EEnvKey.S3_PREVIEW_URL)}.cloudflarestorage.com`,
        };

        this.s3Client = new S3Client(s3Config);
    }

    async uploadS3(buffer: Buffer, key: string, contentType: string, folder: string) {
        const s3Key = `${folder ? folder + '/' : ''}${key}`;
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Body: Buffer.from(buffer),
            Key: s3Key,
            ContentType: contentType ?? 'application/octet-stream',
        });

        await this.s3Client.send(command);

        return encodeURI(`${this.configService.get(EEnvKey.S3_URL)}/${s3Key}`);
    }

    async removeFromS3(key: string) {
        const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });

        const deleteResult = await this.s3Client.send(command);
        return deleteResult;
    }
}
