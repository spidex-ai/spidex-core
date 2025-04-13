import { TOKEN_STATS_CACHE_KEY, TOKEN_STATS_CACHE_TTL, TOP_MCAP_TOKENS_CACHE_KEY, TOP_MCAP_TOKENS_CACHE_TTL, TOP_VOLUME_TOKENS_CACHE_KEY, TOP_VOLUME_TOKENS_CACHE_TTL } from "@constants/cache.constant";
import { EError } from "@constants/error.constant";
import { TokenMetadataEntity } from "@database/entities/token-metadata.entity";
import { SwapService } from "@modules/swap/swap.service";
import { TokenMetaService } from "@modules/token-metadata/token-meta.service";
import { TokenPriceService } from "@modules/token-price/token-price.service";
import { TokenTopTradersRequest } from "@modules/token/dtos/token-request.dto";
import { TokenStatsResponse, TokenTopHoldersResponse, TokenTradesResponse } from "@modules/token/dtos/token-response.dto";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { BadRequestException } from "@shared/exception";
import { Cache } from "cache-manager";
import Decimal from "decimal.js";
import { BlockfrostService } from "external/blockfrost/blockfrost.service";
import { TaptoolsService } from "external/taptools/taptools.service";
import { TopToken, TopTokenMcap } from "external/taptools/types";
import { keyBy } from "lodash";

@Injectable()
export class TokenService {
    constructor(
        private readonly taptoolsService: TaptoolsService,
        private readonly tokenMetaService: TokenMetaService,
        private readonly tokenPriceService: TokenPriceService,
        private readonly swapService: SwapService,
        private readonly blockfrostService: BlockfrostService,
        @Inject(CACHE_MANAGER)
        private readonly cache: Cache
    ) { }

    async getTopMcapTokens(limit: number = 10, page: number = 1): Promise<TopTokenMcap[]> {
        try {
            const cacheKey = TOP_MCAP_TOKENS_CACHE_KEY(limit, page);
            const cachedData = await this.cache.get<TopTokenMcap[]>(cacheKey);
            if (cachedData) {
                return cachedData;
            }

            const data = await this.taptoolsService.getTopTokensByMcap(page, limit);
            const tokenIds = data.map((token) => token.unit);

            const [tokenDetails, tokenPrice] = await Promise.all([
                this.tokenMetaService.getTokensMetadata(tokenIds, ['logo', 'name', 'ticker']),
                this.tokenPriceService.getAdaPriceInUSD()
            ]);

            const tokenDetailsMap = keyBy<TokenMetadataEntity>(tokenDetails, 'unit');

            const response = data.map((token) => ({
                ...token,
                usdPrice: token.price * tokenPrice,
                logo: tokenDetailsMap[token.unit]?.logo,
                name: tokenDetailsMap[token.unit]?.name,
                ticker: tokenDetailsMap[token.unit]?.ticker
            }));

            await this.cache.set(cacheKey, response, TOP_MCAP_TOKENS_CACHE_TTL);
            return response;
        } catch (error) {
            throw new BadRequestException({
                message: 'Get top mcap tokens failed',
                data: error.response.data,
                validatorErrors: EError.TAPTOOLS_GET_TOP_MCAP_TOKENS_FAILED,
            });
        }
    }

    async getTopVolumeTokens(timeFrame: string = '24h', limit: number = 10, page: number = 1): Promise<TopToken[]> {
        try {
            const cacheKey = TOP_VOLUME_TOKENS_CACHE_KEY(timeFrame, limit, page);
            const cachedData = await this.cache.get<TopToken[]>(cacheKey);
            if (cachedData) {
                return cachedData;
            }

            const data = await this.taptoolsService.getTopTokensByVolume(timeFrame, page, limit);
            const tokenIds = data.map((token) => token.unit);

            const [tokenDetails, tokenPrice] = await Promise.all([
                this.tokenMetaService.getTokensMetadata(tokenIds, ['logo', 'name', 'ticker']),
                this.tokenPriceService.getAdaPriceInUSD()
            ]);

            const tokenDetailsMap = keyBy<TokenMetadataEntity>(tokenDetails, 'unit');

            const response = data.map((token) => ({
                ...token,
                usdPrice: token.price * tokenPrice,
                logo: tokenDetailsMap[token.unit]?.logo,
                name: tokenDetailsMap[token.unit]?.name,
                ticker: tokenDetailsMap[token.unit]?.ticker
            }));

            await this.cache.set(cacheKey, response, TOP_VOLUME_TOKENS_CACHE_TTL);
            return response;
        } catch (error) {
            throw new BadRequestException({
                message: 'Get top volume tokens failed',
                data: error.response.data,
                validatorErrors: EError.TAPTOOLS_GET_TOP_VOLUME_TOKENS_FAILED,
            });
        }
    }

    async getTokenStats(tokenId: string): Promise<TokenStatsResponse> {

        const cacheKey = TOKEN_STATS_CACHE_KEY(tokenId);
        const cachedData = await this.cache.get<TokenStatsResponse>(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        const [
            usdPrice,
            mcap,
            holders,
            tradingStats
        ] = await Promise.all([
            this.tokenPriceService.getAdaPriceInUSD(),
            this.taptoolsService.getTokenMcap(tokenId),
            this.taptoolsService.getTokenHolders(tokenId),
            this.taptoolsService.getTokenTradingStats(tokenId, '24H')
        ]);


        const tokenStats = {
            price: mcap.price,
            usdPrice: new Decimal(mcap.price).mul(usdPrice).toNumber(),
            mcap,
            holders: holders.holders,
            "24h": tradingStats
        }

        await this.cache.set(cacheKey, tokenStats, TOKEN_STATS_CACHE_TTL);
        return tokenStats;
    }

    async getTokenTrades(tokenId: string, timeFrame: string = '24h', limit: number = 10, page: number = 1): Promise<TokenTradesResponse[]> {
        const [data, usdPrice] = await Promise.all([
            this.taptoolsService.getTokenTrades(tokenId, timeFrame, page, limit),
            this.tokenPriceService.getAdaPriceInUSD()
        ]);

        const response = data.map((trade) => ({
            ...trade,
            totalPrice: new Decimal(trade.price).mul(trade.tokenAAmount).toNumber(),
            usdTotalPrice: new Decimal(trade.price).mul(trade.tokenAAmount).mul(usdPrice).toNumber(),
        }));

        return response;
    }

    async getTopTraders(tokenId: string, request: TokenTopTradersRequest) {
        const { timeFrame, limit, page } = request;
        const data = await this.swapService.getTopTraders(tokenId, timeFrame, limit, page);
        return data;
    }

    async getTopHolders(tokenId: string, limit: number = 10, page: number = 1): Promise<TokenTopHoldersResponse[]> {
        const [tokenDetail, tokenPrice, usdPrice, topHolders] = await Promise.all([
            this.blockfrostService.getTokenDetail(tokenId),
            this.taptoolsService.getTokenPrices([tokenId]),
            this.tokenPriceService.getAdaPriceInUSD(),
            this.taptoolsService.getTopTokenHolders(tokenId, page, limit)
        ]);
        const data: TokenTopHoldersResponse[] = topHolders.map((holder) => ({
            address: holder.address,
            amount: holder.amount,
            ownershipPercentage: new Decimal(holder.amount).div(tokenDetail.quantity).mul(100).toNumber(),
            totalPrice: new Decimal(holder.amount).mul(tokenPrice[tokenId]).toNumber(),
            usdTotalPrice: new Decimal(holder.amount).mul(tokenPrice[tokenId]).mul(usdPrice).toNumber()
        }));
        return data;
    }
}
