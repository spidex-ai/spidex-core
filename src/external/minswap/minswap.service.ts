import { EError } from '@constants/error.constant';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { BadRequestException } from '@shared/exception';
import {
  BuildSwapResponse,
  DexHunterTokenDetail,
  EsitmateSwapPayload,
  MinswapAggregatorSearchRequest,
  MinswapAggregatorSearchResponse,
  MinswapAdaPriceResponse,
  MinswapEsitmateSwapResponse,
  MinswapSubmitSwapPayload,
  MinswapSubmitSwapResponse,
  PoolStatsResponse,
  SwapPayload,
  SwapWalletPayload,
} from 'external/minswap/types';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MinswapService {
  constructor(private readonly client: HttpService) {}

  async getTokenDetail(tokenId: string): Promise<DexHunterTokenDetail> {
    try {
      const response = await firstValueFrom(this.client.get<DexHunterTokenDetail>(`swap/token/${tokenId}`));
      return response.data;
    } catch (error) {
      throw new BadRequestException({
        message: 'Get token detail failed',
        validatorErrors: EError.MINSWAP_GET_TOKEN_DETAIL_FAILED,
        data: error.response.data,
      });
    }
  }

  async poolStats(tokenIn: string, tokenOut: string): Promise<PoolStatsResponse[]> {
    try {
      const response = await firstValueFrom(this.client.get<PoolStatsResponse[]>(`stats/pools/${tokenIn}/${tokenOut}`));
      return response.data;
    } catch (error) {
      throw new BadRequestException({
        message: 'Get pool stats failed',
        validatorErrors: EError.DEXHUNTER_GET_POOL_STATS_FAILED,
        data: error.response.data,
      });
    }
  }

  async estimateSwap(payload: EsitmateSwapPayload): Promise<MinswapEsitmateSwapResponse> {
    try {
      const response = await firstValueFrom(
        this.client.post<MinswapEsitmateSwapResponse>('aggregator/estimate', payload),
      );
      return response.data;
    } catch (error) {
      console.log({ error: error.response.data });
      throw new BadRequestException({
        message: 'Estimate swap failed',
        validatorErrors: EError.MINSWAP_ESTIMATE_SWAP_FAILED,
        data: error.response.data,
      });
    }
  }

  /**
   * Estimate required input amount to get desired output amount using binary search
   * @param desiredOutputAmount - The amount of token_out you want to receive
   * @param tokenIn - Input token identifier
   * @param tokenOut - Output token identifier
   * @param slippage - Slippage tolerance (e.g., 0.5 for 0.5%)
   * @param allowMultiHops - Whether to allow multi-hop swaps
   * @param maxIterations - Maximum iterations for binary search (default: 15)
   * @param tolerance - Acceptable difference from desired output (default: 0.01 = 1%)
   */
  async estimateRequiredInput(
    desiredOutputAmount: string,
    tokenIn: string,
    tokenOut: string,
    slippage,
    allowMultiHops: boolean = true,
  ): Promise<{ estimatedInput: string; actualOutput: string; estimate: MinswapEsitmateSwapResponse }> {
    const desiredOutput = parseFloat(desiredOutputAmount);

    // Strategy: Use a small tokenIn amount to get the price, then extrapolate
    // Start with a reasonable guess (e.g., 100 lovelace)
    const smallSample = 10;

    const sampleEstimate = await this.estimateSwap({
      amount: smallSample.toString(),
      token_in: tokenIn,
      token_out: tokenOut,
      slippage,
      allow_multi_hops: allowMultiHops,
    });

    const sampleInput = parseFloat(sampleEstimate.amount_in);
    const sampleOutput = parseFloat(sampleEstimate.min_amount_out);

    // Calculate how much input is needed per unit of output
    const inputPerOutput = sampleInput / sampleOutput;

    // Calculate the estimated input needed for desired output
    // Using Math.ceil to ensure we get at least the desired output
    const estimatedInput = Math.ceil(desiredOutput * inputPerOutput * (1 + slippage / 100));

    // Make a final call with the estimated input to get the actual result
    const finalEstimate = await this.estimateSwap({
      amount: estimatedInput.toString(),
      token_in: tokenIn,
      token_out: tokenOut,
      slippage,
      allow_multi_hops: allowMultiHops,
    });

    return {
      estimatedInput: finalEstimate.amount_in,
      actualOutput: finalEstimate.min_amount_out,
      estimate: finalEstimate,
    };
  }

  async swapWallet(payload: SwapWalletPayload): Promise<void> {
    console.log(payload);
    try {
      const response = await firstValueFrom(this.client.post<void>('swap/wallet', payload));
      return response.data;
    } catch (error) {
      throw new BadRequestException({
        message: 'Swap wallet failed',
        validatorErrors: EError.DEXHUNTER_SWAP_WALLET_FAILED,
        data: error.response.data,
      });
    }
  }

  async buildSwap(payload: SwapPayload): Promise<BuildSwapResponse> {
    console.log(payload);
    const response = await firstValueFrom(this.client.post<BuildSwapResponse>('aggregator/build-tx', payload));
    return response.data;
  }

  async submitSwap(payload: MinswapSubmitSwapPayload): Promise<MinswapSubmitSwapResponse> {
    const response = await firstValueFrom(
      this.client.post<MinswapSubmitSwapResponse>('aggregator/finalize-and-submit-tx', payload),
    );
    return response.data;
  }

  async searchTokens(
    query: string,
    onlyVerified: boolean = true,
    assets?: string[],
    searchAfter?: string[],
  ): Promise<MinswapAggregatorSearchResponse> {
    console.time('searchTokens');
    try {
      const payload: MinswapAggregatorSearchRequest = {
        query,
        only_verified: onlyVerified,
        assets,
        search_after: searchAfter,
      };

      const response = await firstValueFrom(
        this.client.post<MinswapAggregatorSearchResponse>('aggregator/tokens', payload),
      );

      return response.data || { tokens: [], search_after: [] };
    } catch (error) {
      throw new BadRequestException({
        message: 'Aggregator search token failed',
        validatorErrors: EError.MINSWAP_AGGREGATOR_SEARCH_FAILED,
        data: error.response?.data,
      });
    } finally {
      console.timeEnd('searchTokens');
    }
  }
  async getAdaPriceInUSD(): Promise<number> {
    const currency = 'usd';
    console.time('getAdaPriceInUSD');
    try {
      const response = await firstValueFrom(
        this.client.get<MinswapAdaPriceResponse>('aggregator/ada-price', {
          params: { currency },
        }),
      );

      return response.data?.value?.price || 0;
    } catch (error) {
      throw new BadRequestException({
        message: 'Get ADA price failed',
        validatorErrors: EError.MINSWAP_GET_ADA_PRICE_FAILED,
        data: error.response?.data,
      });
    } finally {
      console.timeEnd('getAdaPriceInUSD');
    }
  }
}
