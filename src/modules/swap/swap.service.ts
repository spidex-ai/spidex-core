import { EError } from '@constants/error.constant';
import { BuildSwapRequest, EstimateSwapRequest, GetPoolStatsRequest, SubmitSwapRequest } from '@modules/swap/dtos/swap-request.dto';
import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException } from '@shared/exception';
import { DexhunterService } from 'external/dexhunter/dexhunter.service';

@Injectable()
export class SwapService {
    private readonly logger = new Logger(SwapService.name);
    constructor(private readonly dexhunterService: DexhunterService) { }

    async buildSwap(payload: BuildSwapRequest) {
        try {
            const response = await this.dexhunterService.buildSwap({
                buyer_address: payload.buyerAddress,
                token_in: payload.tokenIn,
                token_out: payload.tokenOut,
                amount_in: payload.amountIn,
                slippage: payload.slippage || 0.01,
                tx_optimization: payload.txOptimization || true,
                blacklisted_dexes: payload.blacklistedDexes || [],
            });
            return response;
        } catch (error) {
            this.logger.error(`Failed to build swap: ${error}`);
            throw new BadRequestException({
                message: 'Failed to build swap',
                data: error.response.data,
                validator_errors: EError.BUILD_SWAP_FAILED,
            });
        }
    }

    async estimateSwap(payload: EstimateSwapRequest) {
        try {
            const response = await this.dexhunterService.estimateSwap({
                token_in: payload.tokenIn,
                token_out: payload.tokenOut,
                amount_in: payload.amountIn,
                slippage: payload.slippage || 0.01,
                blacklisted_dexes: payload.blacklistedDexes || [],
            });
            return response;
        } catch (error) {
            this.logger.error(`Failed to estimate swap: ${error}`);
            throw new BadRequestException({
                message: 'Failed to estimate swap',
                data: error.response.data,
                validator_errors: EError.ESTIMATE_SWAP_FAILED,
            });
        }
    }

    async submitSwap(payload: SubmitSwapRequest) {
        try {
            const response = await this.dexhunterService.submitSwap(payload);
            return response;
        } catch (error) {
            this.logger.error(`Failed to submit swap: ${error}`);
            throw new BadRequestException({
                message: 'Failed to submit swap',
                data: error.response.data,
                validator_errors: EError.SUBMIT_SWAP_FAILED,
            });
        }
    }

    async getPoolStats(payload: GetPoolStatsRequest) {
        try {
            const response = await this.dexhunterService.poolStats(payload.tokenIn, payload.tokenOut);
            return response;
        } catch (error) {
            this.logger.error(`Failed to get pool stats: ${error}`);
            throw new BadRequestException({
                message: 'Failed to get pool stats',
                data: error.response.data,
                validator_errors: EError.GET_POOL_STATS_FAILED,
            });
        }
    }
} 