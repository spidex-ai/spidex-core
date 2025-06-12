import {
  TOKEN_DETAILS_CACHE_KEY,
  TOKEN_DETAILS_CACHE_TTL,
  TOKEN_METADATA_CACHE_KEY,
  TOKEN_METADATA_CACHE_TTL,
  TOKEN_STATS_CACHE_KEY,
  TOKEN_STATS_CACHE_TTL,
  TOKEN_TRADES_CACHE_KEY,
  TOKEN_TRADES_CACHE_TTL,
  TOP_HOLDERS_CACHE_KEY,
  TOP_HOLDERS_CACHE_TTL,
  TOP_MCAP_TOKENS_CACHE_KEY,
  TOP_MCAP_TOKENS_CACHE_TTL,
  TOP_VOLUME_TOKENS_CACHE_KEY,
  TOP_VOLUME_TOKENS_CACHE_TTL,
} from '@constants/cache.constant';
import {
  CARDANO_DECIMALS,
  CARDANO_LOVELACE_UNIT,
  CARDANO_NAME,
  CARDANO_POLICY,
  CARDANO_TICKER,
  CARDANO_TOTAL_SUPPLY,
  CARDANO_UNIT,
} from '@constants/cardano.constant';
import { EEnvKey } from '@constants/env.constant';
import { EError } from '@constants/error.constant';
import { TokenMetadataEntity } from '@database/entities/token-metadata.entity';
import { SwapService } from '@modules/swap/swap.service';
import { TokenMetaService } from '@modules/token-metadata/token-meta.service';
import { TokenPriceService } from '@modules/token-price/token-price.service';
import {
  TokenOHLCVRequest,
  TokenSearchRequest,
  TokenTopMcapRequest,
  TokenTopTradersRequest,
  TokenTopVolumeRequest,
} from '@modules/token/dtos/token-request.dto';
import {
  TokenDetailsResponse,
  TokenStatsResponse,
  TokenTopHoldersResponse,
  TokenTradesResponse,
} from '@modules/token/dtos/token-response.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@shared/exception';
import { Cache } from 'cache-manager';
import Decimal from 'decimal.js';
import { BlockfrostService } from 'external/blockfrost/blockfrost.service';
import { DexhunterService } from 'external/dexhunter/dexhunter.service';
import { TaptoolsService } from 'external/taptools/taptools.service';
import { TokenPriceChange, TopTokenByVolume, TopTokenMcap } from 'external/taptools/types';
import { keyBy, map } from 'lodash';

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
    private readonly cache: Cache,
    private readonly configService: ConfigService,
  ) {}

  async getTokenDetails(tokenId: string): Promise<TokenDetailsResponse> {
    const cacheKey = TOKEN_DETAILS_CACHE_KEY(tokenId);
    const cachedData = await this.cache.get<TokenDetailsResponse>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    if (tokenId.startsWith(CARDANO_LOVELACE_UNIT) || tokenId.startsWith(CARDANO_UNIT)) {
      const [adaPrice, adaInfo] = await Promise.all([
        this.tokenPriceService.getAdaPriceInUSD(),
        this.tokenPriceService.getAdaInfo(),
      ]);
      return {
        policy: CARDANO_POLICY,
        ticker: CARDANO_TICKER,
        token_ascii: CARDANO_TICKER,
        is_verified: true,
        creation_date: new Date().toISOString(),
        logo: `${this.configService.get(EEnvKey.APP_BASE_URL)}/public/icons/tokens/ada.svg`,
        unit: CARDANO_UNIT,
        total_supply: CARDANO_TOTAL_SUPPLY,
        decimals: CARDANO_DECIMALS,
        price: 1,
        usdPrice: adaPrice,
        name: CARDANO_NAME,
        description: 'Cardano is a blockchain platform that enables secure and scalable decentralized applications.',
        price24hChg: adaInfo.market_data.price_change_percentage_24h / 100,
      };
    }

    const data = await this.dexHunterService.getTokenDetail(tokenId);
    const [tokenMetadata, adaPrice, tokenPrice] = await Promise.all([
      this.tokenMetaService.getTokenMetadata(tokenId, ['logo', 'name', 'ticker']),
      this.tokenPriceService.getAdaPriceInUSD(),
      this.taptoolsService.getTokenPrices([tokenId]),
    ]);

    const priceTimeframe = '24h';
    const priceChanges = await this.getTokenPriceChange([tokenId], [priceTimeframe]);
    let price24hChg = 0;
    if (priceChanges && priceChanges.length && priceChanges[0]) {
      price24hChg = priceChanges[0].priceChanges[priceTimeframe];
    }

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
      token_ascii: tokenMetadata?.ticker,
      price24hChg,
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
      const tokenIds = data.map(token => token.unit);

      const priceTimeframe = '24h';
      const [tokenDetails, adaPrice, priceChanges] = await Promise.all([
        this.tokenMetaService.getTokensMetadata(new Set(tokenIds), new Set(['logo', 'name', 'ticker'])),
        this.tokenPriceService.getAdaPriceInUSD(),
        this.getTokenPriceChange(tokenIds, [priceTimeframe]),
      ]);

      const tokenDetailsMap = keyBy<TokenMetadataEntity>(tokenDetails, 'unit');

      const priceChangesMap = keyBy<TokenPriceChange>(priceChanges, 'unit');

      const response = data.map(token => ({
        ...token,
        mcap: token.mcap * adaPrice,
        usdPrice: token.price * adaPrice,
        logo: tokenDetailsMap[token.unit]?.logo,
        name: tokenDetailsMap[token.unit]?.name,
        ticker: tokenDetailsMap[token.unit]?.ticker,
        price24hChg: priceChangesMap[token.unit]?.priceChanges?.[priceTimeframe],
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

  async getTopVolumeTokens(request: TokenTopVolumeRequest): Promise<TopTokenByVolume[]> {
    try {
      const { timeframe, limit, page } = request;
      const cacheKey = TOP_VOLUME_TOKENS_CACHE_KEY(timeframe, limit, page);
      const cachedData = await this.cache.get<TopTokenByVolume[]>(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const data = await this.taptoolsService.getTopTokensByVolume(timeframe, page, limit);
      const tokenIds = data.map(token => token.unit);

      const priceTimeframe = '24h';
      const [tokenDetails, adaPrice, priceChanges] = await Promise.all([
        this.tokenMetaService.getTokensMetadata(new Set(tokenIds), new Set(['logo', 'name', 'ticker'])),
        this.tokenPriceService.getAdaPriceInUSD(),
        this.getTokenPriceChange(tokenIds, [priceTimeframe]),
      ]);

      const tokenDetailsMap = keyBy<TokenMetadataEntity>(tokenDetails, 'unit');

      const priceChangesMap = keyBy<TokenPriceChange>(priceChanges, 'unit');

      const response = data.map(token => ({
        ...token,
        volume: token.volume * adaPrice,
        usdPrice: token.price * adaPrice,
        logo: tokenDetailsMap[token.unit]?.logo,
        name: tokenDetailsMap[token.unit]?.name,
        ticker: tokenDetailsMap[token.unit]?.ticker,
        price24hChg: priceChangesMap[token.unit]?.priceChanges?.[priceTimeframe],
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
    const adaPrice = await this.tokenPriceService.getAdaPriceInUSD();

    if (tokenId.startsWith(CARDANO_LOVELACE_UNIT) || tokenId.startsWith(CARDANO_UNIT)) {
      const [adaInfo, marketStats] = await Promise.all([
        this.tokenPriceService.getAdaInfo(),
        this.taptoolsService.getMarketStats(),
      ]);

      return {
        price: 1,
        usdPrice: adaPrice,
        '24h': {
          buyers: 0,
          buys: 0,
          sellVolume: 0,
          sellers: 0,
          buyVolume: 0,
          sells: 0,
        },
        holders: marketStats.activeAddresses,
        mcap: {
          circSupply: adaInfo.market_data.circulating_supply,
          fdv: adaInfo.market_data.fully_diluted_valuation.usd,
          mcap: adaInfo.market_data.market_cap.usd,
          price: 1,
          ticker: CARDANO_TICKER,
          totalSupply: CARDANO_TOTAL_SUPPLY,
        },
      };
    }

    const [mcap, holders, tradingStats, pools] = await Promise.all([
      this.taptoolsService.getTokenMcap(tokenId),
      this.taptoolsService.getTokenHolders(tokenId),
      this.taptoolsService.getTokenTradingStats(tokenId, '24H'),
      this.taptoolsService.getTokenPools(tokenId, true),
    ]);

    const usdPriceToken = new Decimal(mcap.price).mul(adaPrice).toNumber();
    const liquidity = pools.reduce(
      (acc, pool) => acc + pool.tokenALocked * usdPriceToken + pool.tokenBLocked * adaPrice,
      0,
    );

    const tokenStats = {
      price: mcap.price,
      usdPrice: usdPriceToken,
      mcap: {
        circSupply: mcap.circSupply,
        fdv: mcap.fdv,
        mcap: mcap.mcap * adaPrice,
        price: mcap.price,
        ticker: mcap.ticker,
        totalSupply: mcap.totalSupply,
      },
      holders: holders.holders,
      '24h': tradingStats,
      liquidity: liquidity,
    };

    await this.cache.set(cacheKey, tokenStats, TOKEN_STATS_CACHE_TTL);
    return tokenStats;
  }

  async getTokenTrades(
    tokenId: string,
    timeFrame: string = '24h',
    limit: number = 10,
    page: number = 1,
  ): Promise<TokenTradesResponse[]> {
    const cacheKey = TOKEN_TRADES_CACHE_KEY(tokenId, timeFrame, limit, page);
    const cachedData = await this.cache.get<TokenTradesResponse[]>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    let data;

    if (tokenId.startsWith(CARDANO_LOVELACE_UNIT) || tokenId.startsWith(CARDANO_UNIT)) {
      data = await this.taptoolsService.getTokenTrades(timeFrame, page, limit);
    } else {
      data = await this.taptoolsService.getTokenTrades(timeFrame, page, limit, tokenId);
    }

    const usdPrice = await this.tokenPriceService.getAdaPriceInUSD();

    const response = data.map(trade => ({
      ...trade,
      totalPrice: new Decimal(trade.price).mul(trade.tokenAAmount).toNumber(),
      usdTotalPrice: new Decimal(trade.price).mul(trade.tokenAAmount).mul(usdPrice).toNumber(),
    }));

    await this.cache.set(cacheKey, response, TOKEN_TRADES_CACHE_TTL);
    return response;
  }

  async getTopTraders(tokenId: string, request: TokenTopTradersRequest) {
    const { timeFrame, limit, page } = request;

    if (tokenId.startsWith(CARDANO_LOVELACE_UNIT) || tokenId.startsWith(CARDANO_UNIT)) {
      return [];
    }

    const data = await this.swapService.getTopTraders(tokenId, timeFrame, limit, page);
    return data;
  }

  async getTopHolders(tokenId: string, limit: number = 10, page: number = 1): Promise<TokenTopHoldersResponse[]> {
    const cacheKey = TOP_HOLDERS_CACHE_KEY(tokenId, limit, page);
    const cachedData = await this.cache.get<TokenTopHoldersResponse[]>(cacheKey);
    if (cachedData) {
      console.log('🚀 ~ TokenService ~ getTopHolders ~ cachedData:', cachedData);
      return cachedData;
    }

    if (tokenId.startsWith(CARDANO_LOVELACE_UNIT) || tokenId.startsWith(CARDANO_UNIT)) {
      return [];
    }

    const [tokenDetail, tokenPrice, usdPrice, topHolders] = await Promise.all([
      this.blockfrostService.getTokenDetail(tokenId),
      this.taptoolsService.getTokenPrices([tokenId]),
      this.tokenPriceService.getAdaPriceInUSD(),
      this.taptoolsService.getTopTokenHolders(tokenId, page, limit),
    ]);
    const totalSupply = new Decimal(tokenDetail.quantity)
      .div(10 ** (tokenDetail?.onchain_metadata?.decimals || tokenDetail?.metadata?.decimals || 0))
      .toNumber();
    const data: TokenTopHoldersResponse[] = topHolders.map(holder => ({
      address: holder.address,
      amount: holder.amount,
      ownershipPercentage: new Decimal(holder.amount).div(totalSupply).mul(100).toNumber(),
      totalPrice: new Decimal(holder.amount).mul(tokenPrice[tokenId]).toNumber(),
      usdTotalPrice: new Decimal(holder.amount).mul(tokenPrice[tokenId]).mul(usdPrice).toNumber(),
    }));

    await this.cache.set(cacheKey, data, TOP_HOLDERS_CACHE_TTL);
    return data;
  }

  async searchTokens(request: TokenSearchRequest) {
    const { query, verified, limit, page } = request;

    let pageNumber = page;
    let pageLimit = limit;
    if (!pageNumber) {
      pageNumber = 1;
    }

    if (!pageLimit) {
      pageLimit = 20;
    }

    console.log({ pageLimit, pageNumber });

    const data = await this.dexHunterService.searchToken(query, verified, pageNumber, pageLimit);

    const tokenIds = map(data, 'token_id');
    const [tokenDetails, adaPrice, tokenPrices] = await Promise.all([
      this.tokenMetaService.getTokensMetadata(tokenIds, new Set(['logo', 'ticker', 'name'])),
      this.tokenPriceService.getAdaPriceInUSD(),
      this.taptoolsService.getTokenPrices(tokenIds),
    ]);

    const mapTokenWithDetails = keyBy<TokenMetadataEntity>(tokenDetails, 'unit');
    const tokensWithDetails = map(data, token => ({
      ...token,
      name: mapTokenWithDetails[token.token_id]?.name,
      ticker: mapTokenWithDetails[token.token_id]?.ticker,
      logo: mapTokenWithDetails[token.token_id]?.logo,
      unit: token.token_id,
      price: tokenPrices[token.token_id],
      usdPrice: tokenPrices[token.token_id] * adaPrice,
    })).filter(token => token.price > 0);

    if (query.match(/^(ada|ad|a)$/i)) {
      tokensWithDetails.unshift({
        token_id: CARDANO_UNIT,
        token_decimals: CARDANO_DECIMALS,
        token_policy: CARDANO_POLICY,
        token_ascii: CARDANO_TICKER,
        ticker: CARDANO_TICKER,
        is_verified: true,
        supply: CARDANO_TOTAL_SUPPLY,
        creation_date: new Date().toISOString(),
        price: 1,
        logo: `${this.configService.get(EEnvKey.APP_BASE_URL)}/public/icons/tokens/ada.svg`,
        unit: CARDANO_UNIT,
        usdPrice: adaPrice,
      });
    }
    return tokensWithDetails;
  }

  async getTokenOHLCV(tokenId: string, quote: string, request: TokenOHLCVRequest) {
    if (tokenId.startsWith(CARDANO_LOVELACE_UNIT) || tokenId.startsWith(CARDANO_UNIT)) {
      return this.tokenPriceService.getAdaOHLCV(request);
    }

    const { interval, numIntervals } = request;
    const data = await this.taptoolsService.getTokenOHLCV(tokenId, interval, numIntervals, quote);
    return data;
  }

  async getTokenPriceChange(tokenIds: string[], timeframes: string[] = ['24h']) {
    const response = await Promise.all(
      tokenIds.map(async tokenId => {
        try {
          const data = await this.taptoolsService.getTokenPriceChanges(tokenId, timeframes);
          return {
            unit: tokenId,
            priceChanges: data,
          };
        } catch (error) {
          console.error('TokenService::getTokenPriceChange error:', error);
          return {
            unit: tokenId,
            priceChanges: {},
          };
        }
      }),
    );
    return response;
  }

  async getTokenMetadata(tokenId: string) {
    const cacheKey = TOKEN_METADATA_CACHE_KEY(tokenId);
    const cachedData = await this.cache.get<TokenMetadataEntity>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    if (tokenId.startsWith(CARDANO_LOVELACE_UNIT) || tokenId.startsWith(CARDANO_UNIT)) {
      return {
        unit: CARDANO_UNIT,
        name: CARDANO_NAME,
        ticker: CARDANO_TICKER,
        logo: `${this.configService.get(EEnvKey.APP_BASE_URL)}/public/icons/tokens/ada.svg`,
        description: 'Cardano is a blockchain platform that enables secure and scalable decentralized applications.',
        decimals: CARDANO_DECIMALS,
        policy: CARDANO_POLICY,
        url: 'https://cardano.org',
      };
    }

    const data = await this.tokenMetaService.getTokenMetadata(tokenId, [
      'logo',
      'name',
      'ticker',
      'description',
      'decimals',
      'policy',
      'url',
    ]);

    if (!data.ticker) {
      data.ticker = data.name;
    }

    await this.cache.set(cacheKey, data, TOKEN_METADATA_CACHE_TTL);
    return data;
  }
}
