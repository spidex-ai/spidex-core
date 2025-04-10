import { GetCheckInListFilterDto, UserQuestFilterDto, UserQuestInfoOutput } from "@modules/user-quest/dtos/user-quest.dto";
import { UserQuestService } from "@modules/user-quest/services/user-quest.service";
import { Controller, Get, Param, Put, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthUser } from "@shared/decorators/auth-user.decorator";
import { AuthUserGuard } from "@shared/decorators/auth.decorator";
import { PageDto } from "@shared/dtos/page.dto";
import { IJwtPayload } from "@shared/interfaces/auth.interface";



@ApiTags('User Quest')
@ApiBearerAuth()
@Controller('user-quest')
export class UserQuestController {
  constructor(
    private readonly userQuestService: UserQuestService,
  ) {
  }


  @AuthUserGuard()
  @Put('check-in')
  async checkIn(@AuthUser() user: IJwtPayload) {
    return this.userQuestService.checkIn(user.userId)
  }

  @AuthUserGuard()
  @Get('check-in')
  async getCheckInList(@AuthUser() user: IJwtPayload, @Query() filter: GetCheckInListFilterDto) {
    return this.userQuestService.getCheckInList(user.userId, filter)
  }


  @AuthUserGuard()
  @Put('trigger-social-quest/:questId')
  async triggerSocialQuest(@AuthUser() user: IJwtPayload, @Param('questId') questId: number) {
    return this.userQuestService.triggerSocialQuest(user.userId, questId)
  }



  // @UseGuards(JwtUserAuthGuard)
  // @Put('trigger-social-quest/:questId')
  // async triggerSocialQuest(@ReqContext() ctx: RequestContext, @Param('questId') questId: string) {
  //   return this.userQuestService.triggerSocialQuest(ctx, questId)
  // }

  @AuthUserGuard()
  @Get('')
  async getQuests(
    @Query() filter: UserQuestFilterDto,
    @AuthUser() user: IJwtPayload
  ): Promise<PageDto<UserQuestInfoOutput>> {
    const result = await this.userQuestService.getQuests(user.userId, filter)
    return result
  }

  // @Get('/public')
  // @ApiOperation({
  //   summary: 'Get quest as a list public API',
  // })
  // @ApiResponse({
  //   status: HttpStatus.UNAUTHORIZED,
  //   type: BaseApiErrorResponse,
  // })
  // async getPublicQuests(
  //   @ReqContext() ctx: RequestContext,
  //   @Query() filter: UserQuestFilterDto,
  // ): Promise<UserQuestOutput> {
  //   this.logger.log(ctx, `${this.getQuests.name} was called`);

  //   const result = await this.userQuestService.getPublicQuests(ctx, filter.category)
  //   return result
  // }
}
