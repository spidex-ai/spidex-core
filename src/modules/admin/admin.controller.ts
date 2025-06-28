import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthAdminGuard, GuardPublic } from '@shared/decorators/auth.decorator';
import { AdminAnalyticsRateLimitGuard } from '@shared/guards/admin-analytics-rate-limit.guard';
import { PageDto } from '@shared/dtos/page.dto';
import { AdminService } from './admin.service';
import { AdminLoginDto, CrawlDocsDto, GetCrawlDocsDto } from './dtos/admin-request.dto';
import { CreateQuestDto, QuestFilterDto, QuestResponseDto, UpdateQuestDto } from './dtos/quest-management.dto';
import { AdminAnalyticsService } from './services/admin-analytics.service';
import {
  GetDailyActiveUsersDto,
  GetTopUsersDto,
  DailyActiveUsersResponseDto,
  TopVolumeUserDto,
  TopSilkPointUserDto,
  TopReferralUserDto,
} from './dtos/admin-analytics.dto';
import { AnalyticsExportUtil } from './utils/analytics-export.util';

@Controller('admin')
@ApiTags('admin')
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

  // Analytics Endpoints
  @Get('analytics/daily-active-users')
  @ApiOperation({ summary: 'Get daily active users analytics' })
  @ApiResponse({ type: DailyActiveUsersResponseDto, status: 200, description: 'Daily active users data' })
  @ApiBearerAuth()
  @AuthAdminGuard()
  @UseGuards(AdminAnalyticsRateLimitGuard)
  async getDailyActiveUsers(): Promise<DailyActiveUsersResponseDto> {
    return this.adminAnalyticsService.getDailyActiveUsers();
  }

  @Get('analytics/top-volume-users')
  @ApiOperation({ summary: 'Get top users by trading volume' })
  @ApiResponse({ type: [TopVolumeUserDto], status: 200, description: 'Top volume users data' })
  @ApiBearerAuth()
  @AuthAdminGuard()
  @UseGuards(AdminAnalyticsRateLimitGuard)
  async getTopVolumeUsers(@Query() query: GetTopUsersDto): Promise<TopVolumeUserDto[]> {
    return this.adminAnalyticsService.getTopVolumeUsers(query.timeframe, query.limit);
  }

  @Get('analytics/top-silk-point-users')
  @ApiOperation({ summary: 'Get top users by silk points' })
  @ApiResponse({ type: [TopSilkPointUserDto], status: 200, description: 'Top silk point users data' })
  @ApiBearerAuth()
  @AuthAdminGuard()
  @UseGuards(AdminAnalyticsRateLimitGuard)
  async getTopSilkPointUsers(@Query() query: GetTopUsersDto): Promise<TopSilkPointUserDto[]> {
    return this.adminAnalyticsService.getTopSilkPointUsers(query.timeframe, query.limit);
  }

  @Get('analytics/top-referral-users')
  @ApiOperation({ summary: 'Get top users by referrals' })
  @ApiResponse({ type: [TopReferralUserDto], status: 200, description: 'Top referral users data' })
  @ApiBearerAuth()
  @AuthAdminGuard()
  @UseGuards(AdminAnalyticsRateLimitGuard)
  async getTopReferralUsers(@Query() query: GetTopUsersDto): Promise<TopReferralUserDto[]> {
    return this.adminAnalyticsService.getTopReferralUsers(query.timeframe, query.limit);
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
  @UseGuards(AdminAnalyticsRateLimitGuard)
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
}
