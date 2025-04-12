import { TOP_MCAP_TOKENS_CACHE_KEY, TOP_MCAP_TOKENS_CACHE_TTL, TOP_VOLUME_TOKENS_CACHE_KEY, TOP_VOLUME_TOKENS_CACHE_TTL } from "@constants/cache.constant";
import { EError } from "@constants/error.constant";
import { TokenPriceService } from "@modules/token-price/token-price.service";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { BadRequestException } from "@shared/exception";
import { Cache } from "cache-manager";
import { TaptoolsService } from "external/taptools/taptools.service";
import { TopToken, TopTokenMcap } from "external/taptools/types";
import { TokenCardanoService } from "external/token-cardano/cardano-token.service";
import { BatchTokenCardanoSubject } from "external/token-cardano/types";
import { keyBy } from "lodash";

@Injectable()
export class TokenService {
    constructor(
        private readonly taptoolsService: TaptoolsService,
        private readonly tokenCardanoService: TokenCardanoService,
        private readonly tokenPriceService: TokenPriceService,
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
                this.tokenCardanoService.batchTokenInfo(tokenIds, ['logo', 'name', 'ticker']),
                this.tokenPriceService.getAdaPriceInUSD()
            ]);

            const tokenDetailsMap = keyBy<BatchTokenCardanoSubject>(tokenDetails.subjects, 'subject');

            const response = data.map((token) => ({
                ...token,
                usdPrice: token.price * tokenPrice,
                logo: tokenDetailsMap[token.unit]?.logo?.value,
                name: tokenDetailsMap[token.unit]?.name?.value,
                ticker: tokenDetailsMap[token.unit]?.ticker?.value
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
                this.tokenCardanoService.batchTokenInfo(tokenIds, ['logo', 'name', 'ticker']),
                this.tokenPriceService.getAdaPriceInUSD()
            ]);

            const tokenDetailsMap = keyBy<BatchTokenCardanoSubject>(tokenDetails.subjects, 'subject');

            const response = data.map((token) => ({
                ...token,
                usdPrice: token.price * tokenPrice,
                logo: tokenDetailsMap[token.unit]?.logo?.value,
                name: tokenDetailsMap[token.unit]?.name?.value,
                ticker: tokenDetailsMap[token.unit]?.ticker?.value
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
}
