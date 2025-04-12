import { EError } from '@constants/error.constant';
import { SwapAction } from '@database/entities/swap-transaction.entity';
import { SwapTransactionRepository } from '@database/repositories/swap-transaction.repository';
import { BuildSwapRequest, EstimateSwapRequest, GetPoolStatsRequest, SubmitSwapRequest } from '@modules/swap/dtos/swap-request.dto';
import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException } from '@shared/exception';
import { BlockfrostService } from 'external/blockfrost/blockfrost.service';
import { DexhunterService } from 'external/dexhunter/dexhunter.service';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class SwapService {
    private readonly logger = new Logger(SwapService.name);
    constructor(
        private readonly dexhunterService: DexhunterService,
        private readonly blockfrostService: BlockfrostService,
        private readonly swapTransactionRepository: SwapTransactionRepository
    ) { }

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
                validatorErrors: EError.DEXHUNTER_BUILD_SWAP_FAILED,
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
                validatorErrors: EError.DEXHUNTER_ESTIMATE_SWAP_FAILED,
            });
        }
    }

    @Transactional()
    async submitSwap(payload: SubmitSwapRequest) {
        try {
            const response = await this.dexhunterService.submitSwap(payload);
            // Create 2 swap transactions, 1 for buy and 1 for sell


            return response;
        } catch (error) {
            this.logger.error(`Failed to submit swap: ${error}`);
            throw new BadRequestException({
                message: 'Failed to submit swap',
                data: error.response.data,
                validatorErrors: EError.DEXHUNTER_SUBMIT_SWAP_FAILED,
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
                validatorErrors: EError.DEXHUNTER_GET_POOL_STATS_FAILED,
            });
        }
    }

    async getTopTraders(tokenId: string, timeFrame: string = '24h', limit: number = 10, page: number = 1) {
        try {
            const now = new Date();
            let startTime = new Date();
            switch (timeFrame) {
                case '1h':
                    startTime.setHours(now.getHours() - 1);
                    break;
                case '4h':
                    startTime.setHours(now.getHours() - 4);
                    break;
                case '12h':
                    startTime.setHours(now.getHours() - 12);
                    break;
                case '24h':
                    startTime.setHours(now.getHours() - 24);
                    break;
                case '7d':
                    startTime.setDate(now.getDate() - 7);
                    break;
                case '30d':
                    startTime.setDate(now.getDate() - 30);
                    break;
                case 'all':
                    startTime = new Date(0); // Beginning of time
                    break;
                default:
                    startTime.setHours(now.getHours() - 24); // Default to 24h
            }

            // Query to get trading volumes
            const traders = await this.swapTransactionRepository
                .createQueryBuilder('swap')
                .leftJoin('users', 'user', 'user.id = swap.user_id')
                .select([
                    'user.wallet_address',
                    'SUM(CASE WHEN swap.action = :buyAction THEN swap.token_b_amount ELSE 0 END) as "buyVolume"',
                    'SUM(CASE WHEN swap.action = :sellAction THEN swap.token_a_amount ELSE 0 END) as "sellVolume"',
                    'SUM(CASE WHEN swap.action = :buyAction THEN swap.token_b_amount ELSE -swap.token_a_amount END) as "netVolume"',
                    'SUM(CASE WHEN swap.action = :buyAction THEN swap.token_b_amount ELSE swap.token_a_amount END) as "totalVolume"'
                ])
                .where('(swap.token_a = :tokenId OR swap.token_b = :tokenId)', { tokenId })
                .andWhere('swap.timestamp >= :startTime', { startTime })
                .setParameter('buyAction', SwapAction.BUY)
                .setParameter('sellAction', SwapAction.SELL)
                .groupBy('swap.user_id, user.wallet_address')
                .orderBy('"totalVolume"', 'DESC')
                .skip((page - 1) * limit)
                .take(limit)
                .getRawMany();


            // Format the response
            return traders.map(trader => ({
                address: trader.wallet_address,
                totalVolume: parseFloat(trader.totalVolume),
                buyVolume: parseFloat(trader.buyVolume),
                sellVolume: parseFloat(trader.sellVolume),
                netVolume: parseFloat(trader.netVolume)
            }));
        } catch (error) {
            this.logger.error(`Failed to get top traders: ${error}`);
            throw new BadRequestException({
                message: 'Failed to get top traders',
                data: error,
                validatorErrors: EError.GET_TOP_TRADERS_FAILED
            });
        }
    }

    async getTransactionDetail(txHash: string) {
        const response = await this.blockfrostService.getTransactionDetail(txHash);
        return response;
    }

    async getTradingVolume(userId: number) {
        const response = await this.swapTransactionRepository.createQueryBuilder('swap')
            .where('swap.user_id = :userId', { userId })
            .select(
                'SUM(CASE WHEN swap.action = :buyAction THEN swap.token_b_amount ELSE swap.token_a_amount END) as "totalVolume"'
            )
            .setParameter('buyAction', SwapAction.BUY)
            .setParameter('sellAction', SwapAction.SELL)
            .groupBy('swap.user_id')
            .getRawOne();

        return response.totalVolume || 0;
    }
} 