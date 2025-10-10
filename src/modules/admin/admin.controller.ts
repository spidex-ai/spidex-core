import { Body, Controller, Delete, Get, Param, Post, Put, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthAdminGuard, GuardPublic } from '@shared/decorators/auth.decorator';
import { Timezone } from '@shared/decorators/timezone.decorator';
import { PageDto } from '@shared/dtos/page.dto';
import { Response } from 'express';
import { AdminService } from './admin.service';
import {
  GetTopUsersDto,
  TopReferralUserDto,
  TopSilkPointUserDto,
  TopVolumeUserDto,
  UserAnalyticsDto,
} from './dtos/admin-analytics.dto';
import { AdminLoginDto, CrawlDocsDto, GetCrawlDocsDto } from './dtos/admin-request.dto';
import { CreateQuestDto, QuestFilterDto, QuestResponseDto, ReorderQuestsDto, UpdateQuestDto } from './dtos/quest-management.dto';
import { AdminAnalyticsService } from './services/admin-analytics.service';
import { AnalyticsExportUtil } from './utils/analytics-export.util';

@Controller('admin')
@ApiTags('admin')
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly adminAnalyticsService: AdminAnalyticsService,
  ) {}

  @Post('create')
  @ApiOperation({ summary: 'Login to the admin panel' })
  @GuardPublic()
  async create() {
    return this.adminService.create();
  }

  @Post('login')
  @ApiOperation({ summary: 'Login to the admin panel' })
  @GuardPublic()
  async login(@Body() loginDto: AdminLoginDto) {
    return this.adminService.login(loginDto);
  }

  @Post('crawl-docs')
  @ApiOperation({ summary: 'Crawl docs' })
  @ApiBearerAuth()
  @AuthAdminGuard()
  async crawlDocs(@Body() crawlDocsDto: CrawlDocsDto) {
    return this.adminService.crawlDocs(crawlDocsDto);
  }

  @Get('crawl-docs')
  @ApiOperation({ summary: 'Get crawl docs' })
  @ApiBearerAuth()
  @AuthAdminGuard()
  async getCrawlDocs(@Query() getCrawlDocsDto: GetCrawlDocsDto) {
    return this.adminService.getCrawlDocs(getCrawlDocsDto);
  }

  // Quest Management Endpoints
  @Post('quests')
  @ApiOperation({ summary: 'Create a new quest' })
  @ApiResponse({ type: QuestResponseDto, status: 201, description: 'Quest created successfully' })
  @ApiBearerAuth()
  @AuthAdminGuard()
  async createQuest(@Body() createQuestDto: CreateQuestDto): Promise<QuestResponseDto> {
    return this.adminService.createQuest(createQuestDto);
  }

  @Get('quests')
  @ApiOperation({ summary: 'Get all quests with filtering' })
  @ApiResponse({ type: PageDto<QuestResponseDto>, status: 200, description: 'Quests retrieved successfully' })
  @ApiBearerAuth()
  @AuthAdminGuard()
  async getQuests(@Query() filterDto: QuestFilterDto): Promise<PageDto<QuestResponseDto>> {
    return this.adminService.getQuests(filterDto);
  }

  @Put('quests/reorder')
  @ApiOperation({ summary: 'Reorder quests' })
  @ApiResponse({ type: [QuestResponseDto], status: 200, description: 'Quests reordered successfully' })
  @ApiBearerAuth()
  @AuthAdminGuard()
  async reorderQuests(@Body() reorderDto: ReorderQuestsDto): Promise<QuestResponseDto[]> {
    return this.adminService.reorderQuests(reorderDto);
  }

  @Get('quests/:id')
  @ApiOperation({ summary: 'Get quest by ID' })
  @ApiResponse({ type: QuestResponseDto, status: 200, description: 'Quest retrieved successfully' })
  @ApiBearerAuth()
  @AuthAdminGuard()
  async getQuestById(@Param('id') id: number): Promise<QuestResponseDto> {
    return this.adminService.getQuestById(id);
  }

  @Put('quests/:id')
  @ApiOperation({ summary: 'Update quest by ID' })
  @ApiResponse({ type: QuestResponseDto, status: 200, description: 'Quest updated successfully' })
  @ApiBearerAuth()
  @AuthAdminGuard()
  async updateQuest(@Param('id') id: number, @Body() updateQuestDto: UpdateQuestDto): Promise<QuestResponseDto> {
    return this.adminService.updateQuest(id, updateQuestDto);
  }

  @Delete('quests/:id')
  @ApiOperation({ summary: 'Delete quest by ID' })
  @ApiResponse({ status: 204, description: 'Quest deleted successfully' })
  @ApiBearerAuth()
  @AuthAdminGuard()
  async deleteQuest(@Param('id') id: number): Promise<void> {
    return this.adminService.deleteQuest(id);
  }

  @Get('analytics/top-volume-users')
  @ApiOperation({ summary: 'Get top users by trading volume' })
  @ApiResponse({ type: [TopVolumeUserDto], status: 200, description: 'Top volume users data' })
  @ApiBearerAuth()
  @AuthAdminGuard()
  async getTopVolumeUsers(@Query() query: GetTopUsersDto): Promise<TopVolumeUserDto[]> {
    return this.adminAnalyticsService.getTopVolumeUsers(query.timeframe, query.limit);
  }

  @Get('analytics/top-silk-point-users')
  @ApiOperation({ summary: 'Get top users by silk points' })
  @ApiResponse({ type: [TopSilkPointUserDto], status: 200, description: 'Top silk point users data' })
  @ApiBearerAuth()
  @AuthAdminGuard()
  async getTopSilkPointUsers(@Query() query: GetTopUsersDto): Promise<TopSilkPointUserDto[]> {
    return this.adminAnalyticsService.getTopSilkPointUsers(query.timeframe, query.limit);
  }

  @Get('analytics/top-referral-users')
  @ApiOperation({ summary: 'Get top users by referrals' })
  @ApiResponse({ type: [TopReferralUserDto], status: 200, description: 'Top referral users data' })
  @ApiBearerAuth()
  @AuthAdminGuard()
  async getTopReferralUsers(@Query() query: GetTopUsersDto): Promise<TopReferralUserDto[]> {
    return this.adminAnalyticsService.getTopReferralUsers(query.timeframe, query.limit);
  }

  @Get('analytics/users')
  @ApiOperation({ summary: 'Get user analytics including login and wallet statistics' })
  @ApiResponse({ type: UserAnalyticsDto, status: 200, description: 'User analytics data' })
  @ApiBearerAuth()
  @AuthAdminGuard()
  async getUsers(): Promise<UserAnalyticsDto> {
    return this.adminAnalyticsService.getUserAnalytics();
  }

  @Delete('analytics/cache')
  @ApiOperation({ summary: 'Clear analytics cache' })
  @ApiResponse({ status: 204, description: 'Analytics cache cleared successfully' })
  @ApiBearerAuth()
  @AuthAdminGuard()
  async clearAnalyticsCache(@Query('type') cacheType?: string): Promise<void> {
    return this.adminAnalyticsService.clearAnalyticsCache(cacheType);
  }

  @Get('analytics/export/top-volume-users')
  @ApiOperation({ summary: 'Export top volume users data' })
  @ApiResponse({ status: 200, description: 'Top volume users data exported' })
  @ApiBearerAuth()
  @AuthAdminGuard()
  async exportTopVolumeUsers(
    @Query() query: GetTopUsersDto,
    @Query('format') format: 'csv' | 'json' = 'json',
    @Query('privacy') privacy: boolean = true,
    @Res() res: Response,
  ): Promise<void> {
    let data = await this.adminAnalyticsService.getTopVolumeUsers(query.timeframe, query.limit);

    if (privacy) {
      data = AnalyticsExportUtil.sanitizeForPrivacy(data);
    }

    const filename = AnalyticsExportUtil.generateFilename('top_volume_users', format);
    const contentType = AnalyticsExportUtil.getContentType(format);

    let exportData: string;
    if (format === 'csv') {
      exportData = AnalyticsExportUtil.topVolumeUsersToCSV(data);
    } else {
      exportData = AnalyticsExportUtil.topVolumeUsersToJSON(data);
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportData);
  }

  @Get('analytics/dau-chart')
  @ApiOperation({ summary: 'Get DAU chart data' })
  @ApiResponse({
    status: 200,
    description: 'DAU chart data',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          date: { type: 'string', format: 'date' },
          activeUsers: { type: 'number' },
        },
      },
    },
  })
  @ApiBearerAuth()
  @AuthAdminGuard()
  async getDauChart(
    @Query('days') days: number = 30,
    @Timezone() timezone: string,
  ): Promise<{ date: string; activeUsers: number }[]> {
    return this.adminAnalyticsService.getDauChart(timezone, days);
  }

  @Get('analytics/mau-chart')
  @ApiOperation({ summary: 'Get MAU chart data' })
  @ApiResponse({
    status: 200,
    description: 'MAU chart data',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          month: { type: 'string' },
          activeUsers: { type: 'number' },
        },
      },
    },
  })
  @ApiBearerAuth()
  @AuthAdminGuard()
  async getMauChart(
    @Query('months') months: number = 12,
    @Timezone() timezone: string,
  ): Promise<{ month: string; activeUsers: number }[]> {
    return this.adminAnalyticsService.getMauChart(timezone, months);
  }

  @Get('analytics/user-activity-stats')
  @ApiOperation({ summary: 'Get current user activity statistics (DAU/MAU)' })
  @ApiResponse({
    status: 200,
    description: 'Current user activity statistics',
    schema: {
      type: 'object',
      properties: {
        currentDau: { type: 'number' },
        currentMau: { type: 'number' },
        lastUpdated: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getCurrentUserActivityStats(@Timezone() timezone: string): Promise<{
    currentDau: number;
    currentMau: number;
    lastUpdated: string;
  }> {
    return this.adminAnalyticsService.getCurrentUserActivityStats(timezone);
  }
}
