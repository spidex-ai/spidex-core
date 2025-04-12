import { PortfolioService } from "@modules/portfolio/portfolio.service";
import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { GuardPublic } from "@shared/decorators/auth.decorator";
import { PortfolioAddressResponse } from "@modules/portfolio/dtos/portfolio-response.dto";
import { GetPortfolioTransactionsQuery } from "@modules/portfolio/dtos/portfolio.request.dto";
@Controller('portfolio')
@ApiTags('Portfolio')
export class PortfolioController {
    constructor(private readonly portfolioService: PortfolioService) { }

    @Get(':address')
    @ApiOperation({ summary: 'Get portfolio' })
    @ApiParam({ name: 'address', type: String, description: 'Address' })
    @GuardPublic()
    @ApiResponse({
        status: 200,
        description: 'Portfolio',
        type: PortfolioAddressResponse
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