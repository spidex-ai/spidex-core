import { MAX_FILE_SIZE } from '@constants/file.constant';
import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '@shared/decorators/auth-user.decorator';
import { IJwtPayload } from '@shared/interfaces/auth.interface';
import { mediaFileFilter } from '@shared/utils/upload';
import { MediasService } from './medias.service';
import { AuthUserGuard } from '@shared/decorators/auth.decorator';

@Controller('medias')
@ApiBearerAuth()
@ApiTags('Uploads')
export class MediasController {
  constructor(private readonly mediaService: MediasService) {}

  @Post('image')
  @AuthUserGuard()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { files: 1, fileSize: MAX_FILE_SIZE },
      fileFilter: mediaFileFilter.bind(this),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  uploadImage(@AuthUser() user: IJwtPayload, @UploadedFile() file: any) {
    return this.mediaService.upload({ file, userId: user.userId });
  }
}
