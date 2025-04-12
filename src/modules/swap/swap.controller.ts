import { BuildSwapRequest, EstimateSwapRequest, SubmitSwapRequest } from '@modules/swap/dtos/swap-request.dto';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GuardPublic } from '@shared/decorators/auth.decorator';
import { SwapService } from './swap.service';

@ApiTags('Swap')
@Controller('swap')
export class SwapController {
    constructor(private readonly swapService: SwapService) { }
    @Post('build')
    @GuardPublic()
    @ApiOperation({ summary: 'Build a swap' })
    @ApiResponse({ status: 200, description: 'Swap built successfully' })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    @ApiResponse({ status: 500, description: 'Internal Server Error' })
    async buildSwap(@Body() body: BuildSwapRequest) {
        return this.swapService.buildSwap(body);
    }


    @Post('estimate')
    @GuardPublic()
    @ApiOperation({ summary: 'Estimate a swap' })
    @ApiResponse({ status: 200, description: 'Swap estimated successfully' })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    @ApiResponse({ status: 500, description: 'Internal Server Error' })
    async estimateSwap(@Body() body: EstimateSwapRequest) {
        return this.swapService.estimateSwap(body);
    }

    @Post('submit')
    @ApiOperation({ summary: 'Submit a swap' })
    @ApiResponse({ status: 200, description: 'Swap submitted successfully' })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    @ApiResponse({ status: 500, description: 'Internal Server Error' })
    async submitSwap(@Body() body: SubmitSwapRequest) {
        return this.swapService.submitSwap(body);
    }

    @Get('pool-stats/:tokenIn/:tokenOut')
    @ApiOperation({ summary: 'Get pool stats' })
    @ApiResponse({ status: 200, description: 'Pool stats fetched successfully' })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    @ApiResponse({ status: 500, description: 'Internal Server Error' })
    @GuardPublic()
    async getPoolStats(@Param('tokenIn') tokenIn: string, @Param('tokenOut') tokenOut: string) {
        return this.swapService.getPoolStats({ tokenIn, tokenOut });
    }

    @Get('transaction/:txHash')
    @ApiOperation({ summary: 'Get transaction detail' })
    @ApiResponse({ status: 200, description: 'Transaction detail fetched successfully' })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    @ApiResponse({ status: 500, description: 'Internal Server Error' })
    @GuardPublic()
    async getTransactionDetail(@Param('txHash') txHash: string) {
        return this.swapService.getTransactionDetail(txHash);
    }
}