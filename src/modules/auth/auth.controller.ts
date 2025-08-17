import { Body, Controller, Get, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthUser } from '@shared/decorators/auth-user.decorator';
import { AuthUserGuard, GuardPublic, GuardPublicOrAuth } from '@shared/decorators/auth.decorator';
import { IJwtPayload } from '@shared/interfaces/auth.interface';
import { AuthService } from './auth.service';
import {
  ConnectDiscordRequestDto,
  ConnectGoogleRequestDto,
  ConnectTelegramRequestDto,
  ConnectWalletRequestDto,
  ConnectXRequestDto,
  RefreshTokenRequestDto,
  GenerateNonceRequestDto,
} from './dtos/auth-request.dto';
import { AuthResponseOutputDto, RefreshTokenResponseDto, GenerateNonceResponseDto } from './dtos/auth-response.dto';

@Controller('auth')
@ApiTags('Auth')
@ApiBearerAuth()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('wallet/nonce')
  @GuardPublic()
  @ApiOperation({
    summary: 'Generate authentication nonce for wallet connection',
    description:
      'Generates a secure nonce and challenge message for wallet authentication. The nonce expires in 15 minutes.',
  })
  @ApiResponse({
    type: GenerateNonceResponseDto,
    status: HttpStatus.OK,
    description: 'Nonce generated successfully',
  })
  async generateWalletNonce(@Body() generateNonceInput: GenerateNonceRequestDto): Promise<GenerateNonceResponseDto> {
    return this.authService.generateWalletNonce(generateNonceInput.walletAddress);
  }

  @Post('connect-wallet')
  @GuardPublicOrAuth()
  @ApiResponse({
    type: AuthResponseOutputDto,
    status: HttpStatus.OK,
    description: 'Successful',
  })
  async connectWallet(@AuthUser() user: IJwtPayload, @Body() connectWalletInput: ConnectWalletRequestDto) {
    return this.authService.connectWallet(connectWalletInput, user?.userId);
  }

  @Get('me')
  @AuthUserGuard()
  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successful',
  })
  me(@AuthUser() user: IJwtPayload) {
    return this.authService.me(user.userId);
  }

  @Post('refresh-token')
  @GuardPublic()
  @ApiResponse({
    type: RefreshTokenResponseDto,
    status: HttpStatus.OK,
    description: 'Successful',
  })
  async refreshToken(@Body() refreshTokenInput: RefreshTokenRequestDto): Promise<RefreshTokenResponseDto> {
    return this.authService.refreshToken(refreshTokenInput);
  }

  @Post('/connect/x')
  @ApiOperation({
    summary: 'Connect X',
  })
  @GuardPublicOrAuth()
  async connectX(@AuthUser() user: IJwtPayload, @Body() body: ConnectXRequestDto): Promise<AuthResponseOutputDto> {
    return await this.authService.connectX(body, user?.userId);
  }

  @Post('connect/google')
  @ApiOperation({
    summary: 'Connect Google',
  })
  @GuardPublicOrAuth()
  async connectGoogle(
    @AuthUser() user: IJwtPayload,
    @Body() body: ConnectGoogleRequestDto,
  ): Promise<AuthResponseOutputDto> {
    return await this.authService.connectGoogle(body, user?.userId);
  }

  @Get('discord/auth-url')
  @ApiOperation({
    summary: 'Get Discord OAuth2 authorization URL',
  })
  @GuardPublic()
  getDiscordAuthUrl(@Query('redirectUri') redirectUri: string, @Query('state') state?: string) {
    return this.authService.getDiscordAuthUrl(redirectUri, state);
  }

  @Post('connect/discord')
  @ApiOperation({
    summary: 'Connect Discord',
  })
  @GuardPublicOrAuth()
  async connectDiscord(
    @AuthUser() user: IJwtPayload,
    @Body() body: ConnectDiscordRequestDto,
  ): Promise<AuthResponseOutputDto> {
    return await this.authService.connectDiscord(body, user?.userId);
  }

  @Get('telegram/widget-config')
  @ApiOperation({
    summary: 'Get Telegram Login Widget configuration',
  })
  @GuardPublic()
  getTelegramWidgetConfig() {
    return this.authService.getTelegramWidgetConfig();
  }

  @Post('connect/telegram')
  @ApiOperation({
    summary: 'Connect Telegram',
  })
  @GuardPublicOrAuth()
  async connectTelegram(
    @AuthUser() user: IJwtPayload,
    @Body() body: ConnectTelegramRequestDto,
  ): Promise<AuthResponseOutputDto> {
    return await this.authService.connectTelegram(body, user?.userId);
  }
}
