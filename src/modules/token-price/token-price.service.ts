import { TOKEN_PRICE_IN_USD_CACHE_KEY, TOKEN_PRICE_IN_USD_CACHE_TTL } from "@constants/cache.constant";
import { EError } from "@constants/error.constant";
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { BadRequestException } from "@shared/exception";
import { CoingeckoService } from "external/coingecko/coingecko.service";

@Injectable()
export class TokenPriceService {
    constructor(
        private readonly coingeckoService: CoingeckoService,
        @Inject(CACHE_MANAGER)
        private readonly cache: Cache
    ) { }

    async getAdaPriceInUSD(): Promise<number> {
        try {
            const cacheKey = TOKEN_PRICE_IN_USD_CACHE_KEY('ada');
            const cachedData = await this.cache.get<number>(cacheKey);
            if (cachedData) {
                return cachedData;
            }

            const response = await this.coingeckoService.getTokenPrice(['cardano'], ['usd']);
            const adaPrice = response['cardano']['usd'];
            await this.cache.set(cacheKey, adaPrice, TOKEN_PRICE_IN_USD_CACHE_TTL);
            return adaPrice;
        } catch (error) {
            throw new BadRequestException({
                data: error.response.data,
                message: 'Failed to fetch token price in USD',
                validatorErrors: EError.COINGECKO_TOKEN_PRICE_FETCH_ERROR
            });
        }
    }
}

