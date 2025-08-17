import { EError } from '@constants/error.constant';
import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException } from '@shared/exception/exception.resolver';
import { SvgSanitizerService } from '@shared/services/svg-sanitizer.service';
import { getFileBuffer } from '@shared/utils/upload';
import { S3Service } from 'external/aws/s3/s3.service';
import mime from 'mime-types';

@Injectable()
export class MediasService {
  private readonly logger = new Logger(MediasService.name);

  constructor(
    private awsService: S3Service,
    private svgSanitizerService: SvgSanitizerService,
  ) {}

  async upload({ file, userId }: { file: any; userId?: number }) {
    // Get file buffer (handles both memory and disk storage)
    let fileBuffer: Buffer;
    try {
      fileBuffer = await getFileBuffer(file);
    } catch (error) {
      this.logger.error(`Failed to read file buffer: ${error}`);
      throw new BadRequestException({
        validatorErrors: EError.INVALID_AVATAR,
        message: 'Unable to read uploaded file',
      });
    }

    let contentType = mime.lookup(file.originalname) as string;

    // Generate filename with timestamp and user folder structure
    const timestamp = Date.now();
    const originalName = file.originalname;
    const fileExtension = originalName.substring(originalName.lastIndexOf('.'));
    const baseFileName = originalName.substring(0, originalName.lastIndexOf('.'));

    // Create user folder structure: user_{userId} or 'anonymous' if no userId
    const userFolder = userId ? `user_${userId}` : 'anonymous';

    // Generate final filename: {baseFileName}_{timestamp}{extension}
    let fileName = `${baseFileName}_${timestamp}${fileExtension}`;

    // Special handling for SVG files
    if (file.isSvg || fileName.toLowerCase().endsWith('.svg')) {
      this.logger.log(`Processing SVG file: ${fileName}`);

      // Sanitize SVG content
      const sanitizationResult = await this.svgSanitizerService.validateSvgFile(fileBuffer);

      if (!sanitizationResult.isValid) {
        this.logger.error(`SVG sanitization failed for ${fileName}: ${sanitizationResult.error}`);
        throw new BadRequestException({
          validatorErrors: EError.INVALID_AVATAR,
          message: `SVG file is invalid or contains dangerous content: ${sanitizationResult.error}`,
        });
      }

      // Use sanitized content
      fileBuffer = Buffer.from(sanitizationResult.sanitizedContent!, 'utf8');

      // Force content type to be safe for SVG
      contentType = 'image/svg+xml';

      // Add security suffix to filename to indicate it's been sanitized
      const nameWithoutExt = fileName.replace(/\.svg$/i, '');
      fileName = `${nameWithoutExt}_sanitized.svg`;

      this.logger.log(
        `SVG sanitized successfully. Original: ${sanitizationResult.originalSize} bytes, Sanitized: ${sanitizationResult.sanitizedSize} bytes`,
      );
    }

    // Upload to S3 with user folder structure
    const s3Folder = `images/${userFolder}`;
    const url = await this.awsService.uploadS3(fileBuffer, fileName, contentType, s3Folder);

    this.logger.log(`File uploaded successfully: ${fileName} -> ${url}`);
    return url;
  }
}
