import {
  ADA_INFO_CACHE_KEY,
  ADA_INFO_CACHE_TTL,
  ADA_OHLCV_CACHE_KEY,
  ADA_OHLCV_CACHE_TTL,
  TOKEN_PRICE_IN_USD_CACHE_KEY,
  TOKEN_PRICE_IN_USD_CACHE_TTL,
} from '@constants/cache.constant';
import { CARDANO_COINGECKO_ID } from '@constants/cardano.constant';
import { EError } from '@constants/error.constant';
import { TokenOHLCVRequest } from '@modules/token/dtos/token-request.dto';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { BadRequestException } from '@shared/exception';
import { CoingeckoService } from 'external/coingecko/coingecko.service';
import { CoingeckoTokenInfo } from 'external/coingecko/types';
import { MinswapService } from 'external/minswap/minswap.service';
import { TaptoolsService } from 'external/taptools/taptools.service';
import { TokenOHLCV } from 'external/taptools/types';

@Injectable()
export class TokenPriceService {
  constructor(
    private readonly coingeckoService: CoingeckoService,
    private readonly tapToolsService: TaptoolsService,
    private readonly minswapService: MinswapService,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
  ) {}

  async getAdaPriceInUSD(): Promise<number> {
    console.time('getAdaPriceInUSD');
    try {
      const cacheKey = TOKEN_PRICE_IN_USD_CACHE_KEY('ada');
      const cachedData = await this.cache.get<number>(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const response = await this.minswapService.getAdaPriceInUSD();
      const adaPrice = response;
      await this.cache.set(cacheKey, adaPrice, TOKEN_PRICE_IN_USD_CACHE_TTL);
      return adaPrice;
    } catch (error) {
      throw new BadRequestException({
        data: error.response.data,
        message: 'Failed to fetch token price in USD',
        validatorErrors: EError.COINGECKO_TOKEN_PRICE_FETCH_ERROR,
      });
    } finally {
      console.timeEnd('getAdaPriceInUSD');
    }
  }

  async getAdaOHLCV(request: TokenOHLCVRequest) {
    const cacheKey = ADA_OHLCV_CACHE_KEY(request.interval, request.numIntervals);

    const cachedData = await this.cache.get<TokenOHLCV[]>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const data = await this.coingeckoService.getOHLCV(CARDANO_COINGECKO_ID, request);

    await this.cache.set(cacheKey, data, ADA_OHLCV_CACHE_TTL);
    return data;
  }

  async getAdaInfo() {
    const cacheKey = ADA_INFO_CACHE_KEY();
    const cachedData = await this.cache.get<CoingeckoTokenInfo>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const data = await this.coingeckoService.getTokenById(CARDANO_COINGECKO_ID);
    await this.cache.set(cacheKey, data, ADA_INFO_CACHE_TTL);
    return data;
  }
}
