import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthAdminGuard, GuardPublic } from '@shared/decorators/auth.decorator';
import { PageDto } from '@shared/dtos/page.dto';
import { AdminService } from './admin.service';
import { AdminLoginDto, CrawlDocsDto, GetCrawlDocsDto } from './dtos/admin-request.dto';
import { CreateQuestDto, QuestFilterDto, QuestResponseDto, UpdateQuestDto } from './dtos/quest-management.dto';

@Controller('admin')
@ApiTags('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
}
