import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { CoingeckoTokenInfo, CoingeckoTokenPrice } from 'external/coingecko/types';
import { firstValueFrom } from 'rxjs';
import { BadRequestException } from '@shared/exception';
import { EError } from '@constants/error.constant';
import { TokenOHLCV } from 'external/taptools/types';
import { TokenOHLCVRequest } from '@modules/token/dtos/token-request.dto';

@Injectable()
export class CoingeckoService {
  constructor(private readonly client: HttpService) {}

  async getTokenPrice(ids: string[], vsCurrencies: string[]): Promise<CoingeckoTokenPrice> {
    try {
      const response = await firstValueFrom(
        this.client.get<CoingeckoTokenPrice>('simple/price', {
          params: { ids, vs_currencies: vsCurrencies.join(',') },
        }),
      );
      return response.data;
    } catch (error) {
      throw new BadRequestException({
        message: 'Get token price failed',
        validatorErrors: EError.COINGECKO_GET_TOKEN_PRICE_FAILED,
        data: error.response.data,
      });
    }
  }

  async getOHLCV(id: string, request: TokenOHLCVRequest): Promise<TokenOHLCV[]> {
    try {
      const vsCurrency = 'usd';
      let days = '1';
      switch (request.interval) {
        case '3d':
          days = '7';
          break;
        case '1w':
          days = '7';
          break;
        case '1M':
          days = '30';
          break;
      }

      const response = await firstValueFrom(
        this.client.get<number[][]>(`coins/${id}/ohlc`, { params: { vs_currency: vsCurrency, days } }),
      );
      return response.data.map(data => ({
        time: data[0] / 1000,
        open: data[1],
        high: data[2],
        low: data[3],
        close: data[4],
        volume: 0,
      }));
    } catch (error) {
      throw new BadRequestException({
        message: 'Get token OHLCV failed',
        validatorErrors: EError.COINGECKO_GET_TOKEN_OHLCV_FAILED,
        data: error.response.data,
      });
    }
  }

  async getTokenById(id: string): Promise<CoingeckoTokenInfo> {
    try {
      const response = await firstValueFrom(this.client.get<CoingeckoTokenInfo>(`coins/${id}`));
      return response.data;
    } catch (error) {
      throw new BadRequestException({
        message: 'Get token by id failed',
        validatorErrors: EError.COINGECKO_GET_TOKEN_BY_ID_FAILED,
        data: error.response.data,
      });
    }
  }
}
