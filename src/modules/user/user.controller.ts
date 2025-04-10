import { Body, Controller, Get, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '@shared/decorators/auth-user.decorator';
import { AuthUserGuard, GuardPublic } from '@shared/decorators/auth.decorator';
import { IJwtPayload } from '@shared/interfaces/auth.interface';
import {
  UpdateProfileDto
} from './dtos/user-request.dto';
import {
  GetLoginManagementResponseDto,
  GetProfileResponseDto,
  UpdateProfileResponseDto
} from './dtos/user-response.dto';
import { UserService } from './user.service';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post('update-profile')
  @AuthUserGuard()
  @ApiBearerAuth()
  @ApiResponse({
    type: UpdateProfileResponseDto,
    status: HttpStatus.OK,
    description: 'Successful',
  })
  async updateProfile(@AuthUser() user: IJwtPayload, @Body() updateProfileDto: UpdateProfileDto) {
    return this.userService.updateProfile(user.userId, updateProfileDto);
  }

  @Get('profile')
  @AuthUserGuard()
  @ApiBearerAuth()
  @ApiResponse({
    type: GetProfileResponseDto,
    status: HttpStatus.OK,
    description: 'Successful',
  })
  getMyProfile(@AuthUser() user: IJwtPayload) {
    return this.userService.getMyProfile(user.userId);
  }

  @Get('profile/login-management')
  @AuthUserGuard()
  @ApiBearerAuth()
  @ApiResponse({
    type: GetLoginManagementResponseDto,
    status: HttpStatus.OK,
    description: 'Successful',
  })
  getLoginManagement(@AuthUser() user: IJwtPayload) {
    return this.userService.getLoginManagement(user.userId);
  }

  @Get('profile/:walletAddress')
  @GuardPublic()
  @ApiResponse({
    type: GetProfileResponseDto,
    status: HttpStatus.OK,
    description: 'Successful',
  })
  getProfile(@Param('walletAddress') walletAddress: string) {
    return this.userService.getProfile(walletAddress);
  }
}
