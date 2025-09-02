import {
  GetCheckInListFilterDto,
  TriggerAgentQuestQueryDto,
  UserQuestFilterDto,
  UserQuestInfoOutput,
} from '@modules/user-quest/dtos/user-quest.dto';
import { ZealyWebhookPayload, ZealyWebhookResponse } from '@modules/user-quest/interfaces/zealy-webhook.interface';
import { UserQuestService } from '@modules/user-quest/services/user-quest.service';
import { Body, Controller, Get, Headers, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '@shared/decorators/auth-user.decorator';
import { AuthUserGuard } from '@shared/decorators/auth.decorator';
import { PageDto } from '@shared/dtos/page.dto';
import { IJwtPayload } from '@shared/interfaces/auth.interface';

@ApiTags('User Quest')
@ApiBearerAuth()
@Controller('user-quest')
export class UserQuestController {
  constructor(private readonly userQuestService: UserQuestService) {}

  @AuthUserGuard()
  @Put('check-in')
  async checkIn(@AuthUser() user: IJwtPayload) {
    return this.userQuestService.checkIn(user.userId);
  }

  @AuthUserGuard()
  @Get('check-in')
  async getCheckInList(@AuthUser() user: IJwtPayload, @Query() filter: GetCheckInListFilterDto) {
    return this.userQuestService.getCheckInList(user.userId, filter);
  }

  @AuthUserGuard()
  @Put('start-social-quest/:questId')
  async startSocialQuest(@AuthUser() user: IJwtPayload, @Param('questId') questId: number) {
    return this.userQuestService.startSocialQuest(user.userId, questId);
  }

  @AuthUserGuard()
  @Put('trigger-social-quest/:questId')
  async triggerSocialQuest(@AuthUser() user: IJwtPayload, @Param('questId') questId: number) {
    return this.userQuestService.triggerSocialQuest(user.userId, questId);
  }

  @AuthUserGuard()
  @Put('trigger-agent-quest')
  async triggerAgentQuest(@AuthUser() user: IJwtPayload, @Query() query: TriggerAgentQuestQueryDto) {
    return this.userQuestService.triggerAgentQuest(user.userId, query);
  }

  @AuthUserGuard()
  @Get('')
  async getQuests(
    @Query() filter: UserQuestFilterDto,
    @AuthUser() user: IJwtPayload,
  ): Promise<PageDto<UserQuestInfoOutput>> {
    const result = await this.userQuestService.getQuests(user.userId, filter);
    return result;
  }

  @AuthUserGuard()
  @Get('verify/:questId')
  async verifyQuest(@AuthUser() user: IJwtPayload, @Param('questId') questId: number) {
    return this.userQuestService.verifyQuestStatus(user.userId, questId);
  }

  @Post('zealy/webhook')
  async zealyWebhook(
    @Body() payload: ZealyWebhookPayload,
    @Headers('x-api-key') apiKey: string,
  ): Promise<ZealyWebhookResponse> {
    return this.userQuestService.handleZealyWebhook(payload, apiKey);
  }
}
