import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthAdminGuard, GuardPublic } from '@shared/decorators/auth.decorator';
import { AdminService } from './admin.service';
import { AdminLoginDto, CrawlDocsDto, GetCrawlDocsDto } from './dtos/admin-request.dto';

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
}
