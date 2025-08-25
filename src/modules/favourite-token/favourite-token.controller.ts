import { Body, Controller, Get, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '@shared/decorators/auth-user.decorator';

import { AuthUserGuard } from '@shared/decorators/auth.decorator';
import { IJwtPayload } from '@shared/interfaces/auth.interface';
import { CheckFavouriteDto } from './dtos/favourite-token-request.dto';
import {
  CheckFavouriteResponseDto,
  GetSavedTokensResponseDto,
  ToggleFavouriteResponseDto,
} from './dtos/favourite-token-response.dto';
import { FavouriteTokenService } from './favourite-token.service';

@ApiTags('Favourite Token')
@Controller('favourite-token')
export class FavouriteTokenController {
  constructor(private readonly favouriteTokenService: FavouriteTokenService) {}

  @Get()
  @AuthUserGuard()
  @ApiBearerAuth()
  @ApiResponse({
    type: GetSavedTokensResponseDto,
    status: HttpStatus.OK,
    description: 'Get saved tokens by user',
  })
  getSavedTokens(@AuthUser() user: IJwtPayload) {
    return this.favouriteTokenService.getSavedTokensByUserId(user.userId);
  }

  @Put(':id/toggle')
  @AuthUserGuard()
  @ApiBearerAuth()
  @ApiResponse({
    type: ToggleFavouriteResponseDto,
    status: HttpStatus.OK,
    description: 'Toggle favourite token',
  })
  toggleFavourite(@AuthUser() user: IJwtPayload, @Param('id') tokenId: string) {
    return this.favouriteTokenService.toggleFavourite(user.userId, tokenId);
  }

  @Post('check')
  @AuthUserGuard()
  @ApiBearerAuth()
  @ApiResponse({
    type: CheckFavouriteResponseDto,
    status: HttpStatus.OK,
    description: 'Check if tokens are favourite',
  })
  checkFavourite(@AuthUser() user: IJwtPayload, @Body() payload: CheckFavouriteDto) {
    return this.favouriteTokenService.checkTokensAreFavourite(user.userId, payload);
  }
}
