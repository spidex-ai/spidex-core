import { Body, Controller, Get, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthUser } from '@shared/decorators/auth-user.decorator';
import { AuthUserGuard, GuardPublic } from '@shared/decorators/auth.decorator';
import { IJwtPayload } from '@shared/interfaces/auth.interface';
import { AuthService } from './auth.service';
import {
  ConnectGoogleRequestDto,
  ConnectWalletRequestDto,
  ConnectXRequestDto,
  RefreshTokenRequestDto
} from './dtos/auth-request.dto';
import {
  AuthResponseOutputDto,
  RefreshTokenResponseDto
} from './dtos/auth-response.dto';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Get('connect-wallet/sign-message')
  @GuardPublic()
  getConnectWalletPublicKey() {
    return this.authService.getConnectWalletSignMessage();
  }

  @Post('connect-wallet')
  @GuardPublic()
  @ApiResponse({
    type: AuthResponseOutputDto,
    status: HttpStatus.OK,
    description: 'Successful',
  })
  async connectWallet(@Body() connectWalletInput: ConnectWalletRequestDto) {
    return this.authService.connectWallet(connectWalletInput);
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
  @GuardPublic()
  async connectX(@Body() body: ConnectXRequestDto): Promise<AuthResponseOutputDto> {
    return await this.authService.connectX(body);
  }

  @Post('connect/google')
  @ApiOperation({
    summary: 'Connect Google',
  })
  @GuardPublic()
  async connectGoogle(@Body() body: ConnectGoogleRequestDto): Promise<AuthResponseOutputDto> {
    return await this.authService.connectGoogle(body);
  }
}
