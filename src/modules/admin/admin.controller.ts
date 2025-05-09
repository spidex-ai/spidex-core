import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AuthAdminGuard, GuardPublic } from '@shared/decorators/auth.decorator'; 
import { AdminLoginDto, CrawlDocsDto, GetCrawlDocsDto } from './dtos/admin-request.dto';
import { IJwtPayloadAdmin } from '@shared/interfaces/auth.interface';


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
