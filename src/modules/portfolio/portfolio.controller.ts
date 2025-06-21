import { PortfolioAddressResponse } from '@modules/portfolio/dtos/portfolio-response.dto';
import { GetPortfolioTransactionsQuery } from '@modules/portfolio/dtos/portfolio.request.dto';
import { PortfolioService } from '@modules/portfolio/portfolio.service';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '@shared/decorators/auth-user.decorator';
import { AuthUserGuard, GuardPublic } from '@shared/decorators/auth.decorator';
import { IJwtPayload } from '@shared/interfaces/auth.interface';
@Controller('portfolio')
@ApiTags('Portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get('')
  @ApiOperation({ summary: 'Get portfolio' })
  @ApiParam({ name: 'address', type: String, description: 'Address' })
  @AuthUserGuard()
  @ApiResponse({
    status: 200,
    description: 'Portfolio',
    type: PortfolioAddressResponse,
  })
  async getMyPortfolio(@AuthUser() user: IJwtPayload) {
    return this.portfolioService.getMyPortfolio(user.userId);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get transactions' })
  @ApiParam({ name: 'address', type: String, description: 'Address' })
  @GuardPublic()
  async getMyTransactions(@AuthUser() user: IJwtPayload, @Query() query: GetPortfolioTransactionsQuery) {
    return this.portfolioService.getMyTransactions(user.userId, query);
  }

  @Get(':address')
  @ApiOperation({ summary: 'Get portfolio' })
  @ApiParam({ name: 'address', type: String, description: 'Address' })
  @GuardPublic()
  @ApiResponse({
    status: 200,
    description: 'Portfolio',
    type: PortfolioAddressResponse,
  })
  async getPortfolio(@Param('address') address: string) {
    return this.portfolioService.getPortfolio(address);
  }

  @Get(':address/transactions')
  @ApiOperation({ summary: 'Get transactions' })
  @ApiParam({ name: 'address', type: String, description: 'Address' })
  @GuardPublic()
  async getTransactions(@Param('address') address: string, @Query() query: GetPortfolioTransactionsQuery) {
    return this.portfolioService.getTransactions(address, query);
  }
}
