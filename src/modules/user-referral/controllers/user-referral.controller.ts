import { ReferralInfoOutput } from "@modules/user-referral/dtos/user-referral-info.dto";
import { UserReferredInfoOutput } from "@modules/user-referral/dtos/user-referred-info.dto";
import { UserReferralService } from "@modules/user-referral/user-referral.service";
import { Controller, Get, HttpStatus, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthUser } from "@shared/decorators/auth-user.decorator";
import { AuthUserGuard } from "@shared/decorators/auth.decorator";
import { PaginationDto } from "@shared/dtos/page-meta.dto";
import { PageDto } from "@shared/dtos/page.dto";
import { IJwtPayload } from "@shared/interfaces/auth.interface";
import { plainToInstanceCustom } from "@shared/utils/class-transform";

@ApiTags('User Referral')
@ApiBearerAuth()
@Controller('user-referral')
export class UserReferralController {
  constructor(private readonly userReferralService: UserReferralService) { }

  @Get('me/info')
  @AuthUserGuard()
  @ApiResponse({
    status: HttpStatus.OK,
  })
  async getReferralInfo(@AuthUser() user: IJwtPayload): Promise<ReferralInfoOutput> {
    return plainToInstanceCustom(ReferralInfoOutput, await this.userReferralService.getReferralInfo(user.userId));
  }

  @Get('me/referred-users')
  @ApiResponse({
    status: HttpStatus.OK,
  })
  async getReferredUsers(@AuthUser() user: IJwtPayload, @Query() pagination: PaginationDto): Promise<PageDto<UserReferredInfoOutput>> {
    return this.userReferralService.getReferredUsers(user.userId, pagination);
  }
}


