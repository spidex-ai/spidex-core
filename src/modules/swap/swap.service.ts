import { EError } from '@constants/error.constant';
import { SwapAction, SwapExchange, SwapStatus, SwapTransactionEntity } from '@database/entities/swap-transaction.entity';
import { EUserPointLogType } from '@database/entities/user-point-log.entity';
import { SwapTransactionRepository } from '@database/repositories/swap-transaction.repository';
import { BuildSwapRequest, EstimateSwapRequest, GetPoolStatsRequest, SubmitSwapRequest } from '@modules/swap/dtos/swap-request.dto';
import { EstimateSwapResponse } from '@modules/swap/dtos/swap-response.dto';
import { SystemConfigService } from '@modules/system-config/system-config.service';
import { TokenMetaService } from '@modules/token-metadata/token-meta.service';
import { TokenPriceService } from '@modules/token-price/token-price.service';
import { UserPointService } from '@modules/user-point/services/user-point.service';
import { EUserPointType } from '@modules/user-point/user-point.constant';
import { UserQuestService } from '@modules/user-quest/services/user-quest.service';
import { forwardRef, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BadRequestException } from '@shared/exception';
import { getTxHashFromCbor } from '@shared/utils/cardano';
import Decimal from 'decimal.js';
import { BlockfrostService } from 'external/blockfrost/blockfrost.service';
import { DexhunterService } from 'external/dexhunter/dexhunter.service';
import { TaptoolsService } from 'external/taptools/taptools.service';
import { Transactional } from 'typeorm-transactional';
import { Blockfrost, Lucid, LucidEvolution, paymentCredentialOf } from "@lucid-evolution/lucid";
import { ConfigService } from '@nestjs/config';
import { EEnvKey } from '@constants/env.constant';


@Injectable()
export class SwapService implements OnModuleInit {
    private readonly logger = new Logger(SwapService.name);
    private lucid: LucidEvolution;
    constructor(
        private readonly dexhunterService: DexhunterService,
        private readonly blockfrostService: BlockfrostService,
        private readonly swapTransactionRepository: SwapTransactionRepository,
        private readonly tapToolsService: TaptoolsService,
        private readonly systemConfigService: SystemConfigService,
        private readonly tokenPriceService: TokenPriceService,
        private readonly tokenMetaService: TokenMetaService,
        @Inject(forwardRef(() => UserPointService))
        private readonly userPointService: UserPointService,
        private readonly userQuestService: UserQuestService,
        private readonly configService: ConfigService
    ) { }
    async onModuleInit() {
        this.lucid = await Lucid(
            new Blockfrost(this.configService.get(EEnvKey.BLOCKFROST_API_URL), this.configService.get(EEnvKey.BLOCKFROST_API_KEY)),
            'Mainnet'
        );
    }

    async buildSwap(userId: number, payload: BuildSwapRequest) {
        try {

            const tokenAUnit = payload.tokenIn;
            const tokenBUnit = payload.tokenOut;
            const adaPrice = await this.tokenPriceService.getAdaPriceInUSD();

            let tokenIn, tokenOut;

            if (payload.tokenIn === 'ADA') {
                tokenIn = {
                    unit: '',
                    name: 'Ada',
                    price: adaPrice
                }
            } else {
                const tokenInPrices = await this.tapToolsService.getTokenPrices([tokenAUnit]);
                tokenIn = await this.tokenMetaService.getTokenMetadata(tokenAUnit, ['name', 'unit']);
                tokenIn.price = tokenInPrices[tokenAUnit] * adaPrice;
            }
            if (payload.tokenOut === 'ADA') {
                tokenOut = {
                    unit: '',
                    name: 'Ada',
                    price: adaPrice
                }
            } else {
                const tokenOutPrices = await this.tapToolsService.getTokenPrices([tokenBUnit]);
                tokenOut = await this.tokenMetaService.getTokenMetadata(tokenBUnit, ['name', 'unit']);
                tokenOut.price = tokenOutPrices[tokenBUnit] * adaPrice;
            }


            await this.dexhunterService.swapWallet({
                addresses: [payload.buyerAddress]
            });

            const response = await this.dexhunterService.buildSwap({
                buyer_address: payload.buyerAddress,
                token_in: tokenIn.unit,
                token_out: tokenOut.unit,
                amount_in: payload.amountIn,
                slippage: payload.slippage || 0.01,
                tx_optimization: payload.txOptimization || true,
                blacklisted_dexes: payload.blacklistedDexes || [],
            });


            const txHash = getTxHashFromCbor(response.cbor);

            const swapSellTx = this.swapTransactionRepository.create({
                userId: userId,
                address: payload.buyerAddress,
                tokenA: tokenIn.unit,
                tokenAName: tokenIn.name,
                tokenB: tokenOut.unit,
                tokenBName: tokenOut.name,
                tokenAAmount: new Decimal(payload.amountIn).toString(),
                tokenBAmount: new Decimal(response.total_output).toString(),
                action: SwapAction.SELL,
                timestamp: new Date(),
                exchange: SwapExchange.DEXHUNTER,
                cborHex: response.cbor,
                totalFee: response.total_fee,
                totalUsd: new Decimal(payload.amountIn).times(tokenIn.price).toString(),
                txHash: txHash,
            });

            const swapBuyTx = this.swapTransactionRepository.create({
                userId: userId,
                address: payload.buyerAddress,
                tokenA: tokenOut.unit,
                tokenAName: tokenOut.name,
                tokenB: tokenIn.unit,
                tokenBName: tokenIn.name,
                tokenAAmount: new Decimal(response.total_output).toString(),
                tokenBAmount: new Decimal(payload.amountIn).toString(),
                action: SwapAction.BUY,
                timestamp: new Date(),
                exchange: SwapExchange.DEXHUNTER,
                cborHex: response.cbor,
                totalFee: response.total_fee,
                totalUsd: new Decimal(response.total_output).times(tokenOut.price).toString(),
                txHash: txHash,
            });

            await this.swapTransactionRepository.save([swapSellTx, swapBuyTx]);

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

    async estimateSwap(payload: EstimateSwapRequest): Promise<EstimateSwapResponse> {
        try {
            let tokenIn, tokenOut;
            if (payload.tokenIn === 'ADA') {
                tokenIn = {
                    unit: '',
                }
            } else {
                tokenIn = {
                    unit: payload.tokenIn,
                }
            }

            if (payload.tokenOut === 'ADA') {
                tokenOut = {
                    unit: '',
                }
            } else {
                tokenOut = {
                    unit: payload.tokenOut,
                }
            }

            const [response, estimatedPoint] = await Promise.all([
                this.dexhunterService.estimateSwap({
                    token_in: tokenIn.unit,
                    token_out: tokenOut.unit,
                    amount_in: payload.amountIn,
                    slippage: payload.slippage || 0.01,
                    blacklisted_dexes: payload.blacklistedDexes || [],
                }),
                this.getEstimatedPoint({
                    tokenIn: tokenIn.unit,
                    amountIn: payload.amountIn
                })
            ]);

            return {
                ...response,
                estimated_point: estimatedPoint
            };
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
    async submitSwap(userId: number, payload: SubmitSwapRequest) {
        try {
            const txHash = getTxHashFromCbor(payload.txCbor);


            const swapTxs = await this.swapTransactionRepository.findBy({
                txHash: txHash,
            });

            if (swapTxs.length === 0) {
                throw new BadRequestException({
                    message: 'Swap transaction not found',
                    validatorErrors: EError.SWAP_TRANSACTION_NOT_FOUND,
                });
            }

            const swapSellTx = swapTxs.find(tx => tx.action === SwapAction.SELL);
            const swapBuyTx = swapTxs.find(tx => tx.action === SwapAction.BUY);

            if (!swapSellTx || !swapBuyTx) {
                throw new BadRequestException({
                    message: 'Swap transaction not found',
                    validatorErrors: EError.SWAP_TRANSACTION_NOT_FOUND,
                });
            }

            swapSellTx.status = SwapStatus.SUCCESS;
            swapBuyTx.status = SwapStatus.SUCCESS;

            const point = await this.getEstimatedPoint({
                tokenIn: swapSellTx.tokenA,
                amountIn: new Decimal(swapSellTx.tokenAAmount).toNumber()
            });

            await this.swapTransactionRepository.save([swapSellTx, swapBuyTx]);

            const response = await this.dexhunterService.submitSwap(payload);

            await this.userPointService.emitUserPointChangeEvent({
                userId: userId,
                logType: EUserPointLogType.FROM_CORE,
                amount: point,
                type: EUserPointType.CORE,
            })

            await this.userQuestService.emitUserQuestRelatedTradeEvent({
                userId: userId,
                txHash: txHash,
            })

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
                .select([
                    'swap.address',
                    'SUM(CASE WHEN swap.action = :buyAction THEN swap.total_usd ELSE 0 END) as "buyVolume"',
                    'SUM(CASE WHEN swap.action = :sellAction THEN swap.total_usd ELSE 0 END) as "sellVolume"',
                    'SUM(CASE WHEN swap.action = :buyAction THEN swap.total_usd ELSE -swap.total_usd END) as "netVolume"',
                    'SUM(swap.total_usd) as "totalVolume"'
                ])
                .where('(swap.token_a = :tokenId OR swap.token_b = :tokenId)', { tokenId })
                .andWhere('swap.timestamp >= :startTime', { startTime })
                .andWhere('swap.status = :status', { status: SwapStatus.SUCCESS })
                .setParameters({
                    buyAction: SwapAction.BUY,
                    sellAction: SwapAction.SELL
                })
                .groupBy('swap.address')
                .orderBy('"totalVolume"', 'DESC')
                .skip((page - 1) * limit)
                .take(limit)
                .getRawMany();


            // Format the response
            return traders.map(trader => ({
                address: trader.address,
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

    async getSellSwapTransaction(txHash: string): Promise<SwapTransactionEntity | null> {
        const response = await this.swapTransactionRepository.findOne({ where: { txHash, action: SwapAction.SELL, status: SwapStatus.SUCCESS } });
        return response;
    }

    async getSwapTransactionByTxHash(txHash: string): Promise<SwapTransactionEntity[] | null> {
        const response = await this.swapTransactionRepository.findBy({ txHash, status: SwapStatus.SUCCESS });
        return response;
    }

    async getTradingVolume(userId: number) {
        const response = await this.swapTransactionRepository.createQueryBuilder('swap')
            .where('swap.user_id = :userId', { userId })
            .andWhere('swap.status = :status', { status: SwapStatus.SUCCESS })
            .select(
                'SUM(swap.total_usd) as "totalVolume"'
            )
            .groupBy('swap.user_id')
            .getRawOne();

        return response?.totalVolume || 0;
    }

    async getEstimatedPoint({ tokenIn, amountIn }: { tokenIn: string, amountIn: number }) {
        const [tokenInPrice, adaPriceInUsd, usdToPoint] = await Promise.all([
            this.tapToolsService.getTokenPrices([tokenIn]),
            this.tokenPriceService.getAdaPriceInUSD(),
            this.systemConfigService.getUsdToPoint()
        ]);
        let tokenInPriceInUsd = 0;
        if (!tokenIn) {
            tokenInPriceInUsd = adaPriceInUsd * amountIn;
        } else {
            tokenInPriceInUsd = tokenInPrice[tokenIn] * adaPriceInUsd * amountIn;
        }

        const estimatedPoint = new Decimal(tokenInPriceInUsd * usdToPoint).toString();
        return estimatedPoint;
    }
} 