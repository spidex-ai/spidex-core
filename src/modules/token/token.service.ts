import { TOKEN_DETAILS_CACHE_KEY, TOKEN_DETAILS_CACHE_TTL, TOKEN_STATS_CACHE_KEY, TOKEN_STATS_CACHE_TTL, TOKEN_TRADES_CACHE_KEY, TOKEN_TRADES_CACHE_TTL, TOP_HOLDERS_CACHE_KEY, TOP_HOLDERS_CACHE_TTL, TOP_MCAP_TOKENS_CACHE_KEY, TOP_MCAP_TOKENS_CACHE_TTL, TOP_VOLUME_TOKENS_CACHE_KEY, TOP_VOLUME_TOKENS_CACHE_TTL } from "@constants/cache.constant";
import { EError } from "@constants/error.constant";
import { TokenMetadataEntity } from "@database/entities/token-metadata.entity";
import { SwapService } from "@modules/swap/swap.service";
import { TokenMetaService } from "@modules/token-metadata/token-meta.service";
import { TokenPriceService } from "@modules/token-price/token-price.service";
import { TokenSearchRequest, TokenTopMcapRequest, TokenTopTradersRequest, TokenTopVolumeRequest } from "@modules/token/dtos/token-request.dto";
import { TokenDetailsResponse, TokenStatsResponse, TokenTopHoldersResponse, TokenTradesResponse } from "@modules/token/dtos/token-response.dto";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { BadRequestException } from "@shared/exception";
import { Cache } from "cache-manager";
import Decimal from "decimal.js";
import { BlockfrostService } from "external/blockfrost/blockfrost.service";
import { DexhunterService } from "external/dexhunter/dexhunter.service";
import { TaptoolsService } from "external/taptools/taptools.service";
import { TopToken, TopTokenMcap } from "external/taptools/types";
import { keyBy, map } from "lodash";

@Injectable()
export class TokenService {
    constructor(
        private readonly taptoolsService: TaptoolsService,
        private readonly tokenMetaService: TokenMetaService,
        private readonly tokenPriceService: TokenPriceService,
        private readonly swapService: SwapService,
        private readonly blockfrostService: BlockfrostService,
        private readonly dexHunterService: DexhunterService,
        @Inject(CACHE_MANAGER)
        private readonly cache: Cache
    ) { }

    async getTokenDetails(tokenId: string): Promise<TokenDetailsResponse> {

        const cacheKey = TOKEN_DETAILS_CACHE_KEY(tokenId);
        const cachedData = await this.cache.get<TokenDetailsResponse>(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        const data = await this.dexHunterService.getTokenDetail(tokenId);
        const [
            tokenMetadata,
            adaPrice,
            tokenPrice
        ] = await Promise.all([
            this.tokenMetaService.getTokenMetadata(tokenId, ['unit', 'logo', 'name', 'ticker']),
            this.tokenPriceService.getAdaPriceInUSD(),
            this.taptoolsService.getTokenPrices([tokenId])
        ]);


        const tokensWithDetails: TokenDetailsResponse = {
            policy: tokenMetadata?.policy,
            ticker: tokenMetadata?.ticker,
            is_verified: data.is_verified,
            creation_date: data.creation_date,
            logo: tokenMetadata.logo,
            unit: tokenMetadata.unit,
            total_supply: data.supply,
            decimals: data.token_decimals,
            price: tokenPrice[tokenId],
            usdPrice: tokenPrice[tokenId] * adaPrice,
            name: tokenMetadata.name,
            description: tokenMetadata.description,
        };

        await this.cache.set(cacheKey, tokensWithDetails, TOKEN_DETAILS_CACHE_TTL);
        return tokensWithDetails;
    }

    async getTopMcapTokens(request: TokenTopMcapRequest): Promise<TopTokenMcap[]> {
        try {
            const { limit, page } = request;
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

    async getTopVolumeTokens(request: TokenTopVolumeRequest): Promise<TopToken[]> {
        try {
            const { timeframe, limit, page } = request;
            const cacheKey = TOP_VOLUME_TOKENS_CACHE_KEY(timeframe, limit, page);
            const cachedData = await this.cache.get<TopToken[]>(cacheKey);
            if (cachedData) {
                return cachedData;
            }

            const data = await this.taptoolsService.getTopTokensByVolume(timeframe, page, limit);
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
        const cacheKey = TOKEN_TRADES_CACHE_KEY(tokenId, timeFrame, limit, page);
        const cachedData = await this.cache.get<TokenTradesResponse[]>(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        const [data, usdPrice] = await Promise.all([
            this.taptoolsService.getTokenTrades(tokenId, timeFrame, page, limit),
            this.tokenPriceService.getAdaPriceInUSD()
        ]);

        const response = data.map((trade) => ({
            ...trade,
            totalPrice: new Decimal(trade.price).mul(trade.tokenAAmount).toNumber(),
            usdTotalPrice: new Decimal(trade.price).mul(trade.tokenAAmount).mul(usdPrice).toNumber(),
        }));

        await this.cache.set(cacheKey, response, TOKEN_TRADES_CACHE_TTL);
        return response;
    }

    async getTopTraders(tokenId: string, request: TokenTopTradersRequest) {
        const { timeFrame, limit, page } = request;
        const data = await this.swapService.getTopTraders(tokenId, timeFrame, limit, page);
        return data;
    }

    async getTopHolders(tokenId: string, limit: number = 10, page: number = 1): Promise<TokenTopHoldersResponse[]> {
        const cacheKey = TOP_HOLDERS_CACHE_KEY(tokenId, limit, page);
        const cachedData = await this.cache.get<TokenTopHoldersResponse[]>(cacheKey);
        if (cachedData) {
            return cachedData;
        }

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

        await this.cache.set(cacheKey, data, TOP_HOLDERS_CACHE_TTL);
        return data;
    }

    async searchTokens(request: TokenSearchRequest) {
        const { query, verified, limit, page } = request;
        console.log({ query })
        const data = await this.dexHunterService.searchToken(query, verified, page, limit);
        const tokenIds = map(data, 'token_id');
        const [tokenDetails, adaPrice, tokenPrices] = await Promise.all([
            this.tokenMetaService.getTokensMetadata(tokenIds, ['logo', 'ticker', 'name']),
            this.tokenPriceService.getAdaPriceInUSD(),
            this.taptoolsService.getTokenPrices(tokenIds)
        ]);
        const mapTokenWithDetails = keyBy<TokenMetadataEntity>(tokenDetails, 'unit');
        const tokensWithDetails = map(data, (token) => ({
            ...token,
            name: mapTokenWithDetails[token.token_id]?.name,
            ticker: mapTokenWithDetails[token.token_id]?.ticker,
            logo: mapTokenWithDetails[token.token_id]?.logo,
            unit: token.token_id,
            price: tokenPrices[token.token_id],
            usdPrice: tokenPrices[token.token_id] * adaPrice,
        }));
        return tokensWithDetails;
    }
}
