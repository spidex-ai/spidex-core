import { Controller, Get, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GuardPublic } from '@shared/decorators/auth.decorator';
import { Request } from 'express';

@Controller('')
@ApiTags('App')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('heath-check')
  @ApiOperation({ summary: 'Check health' })
  @ApiResponse({ status: 200, description: 'Health check' })
  @GuardPublic()
  health() {
    return this.appService.health();
  }

  @Get()
  @GuardPublic()
  async chatWithAgent(@Req() request: Request) {
    const subdomain = request.headers.host.split('.')[0];
    return `Welcome to the app: ${subdomain}`;
  }

  @Get('version')
  @GuardPublic()
  async version() {
    return '1.0.1';
  }
}
