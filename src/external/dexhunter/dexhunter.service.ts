import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  DexHunterSearchTokenInfo,
  DexHunterTokenDetail,
  PoolStatsResponse,
  EsitmateSwapPayload,
  DexHunterEsitmateSwapResponse,
  BuildSwapResponse,
  SwapPayload,
  SubmitSwapPayload,
  SubmitSwapResponse,
  SwapWalletPayload,
} from 'external/dexhunter/types';
import { firstValueFrom } from 'rxjs';
import { filter } from 'lodash';
import { BadRequestException } from '@shared/exception';
import { EError } from '@constants/error.constant';
import { CARDANO_LOVELACE_UNIT } from '@constants/cardano.constant';

@Injectable()
export class DexhunterService {
  constructor(private readonly client: HttpService) {}
  /**
   * Get market stats
   * @param quote - Quote currency (default: ADA)
   * @returns Promise with market stats
   */
  async searchTokens(
    query: string,
    verified: boolean = true,
    page: number = 0,
    limit: number = 10,
  ): Promise<DexHunterSearchTokenInfo[]> {
    console.time('searchTokens');
    try {
      const response = await firstValueFrom(
        this.client.get<DexHunterSearchTokenInfo[]>('swap/tokens', { params: { query, verified, page, limit } }),
      );
      if (!response.data) {
        return [];
      }
      const fakeADAUnit = 'c2c25c82aa1ca031fc27d95f871f99bb3a39c4d263645721b2304397414441';
      const paginatedData = filter(response.data, token => {
        if (token.token_id === fakeADAUnit) {
          return false;
        }
        return token.is_verified === verified;
      });

      return paginatedData.slice((page - 1) * limit, page * limit);
    } catch (error) {
      throw new BadRequestException({
        message: 'Search token failed',
        validatorErrors: EError.DEXHUNTER_SEARCH_TOKEN_FAILED,
        data: error.response.data,
      });
    } finally {
      console.timeEnd('searchTokens');
    }
  }

  async getTokenDetail(tokenId: string): Promise<DexHunterTokenDetail> {
    try {
      const response = await firstValueFrom(this.client.get<DexHunterTokenDetail>(`swap/token/${tokenId}`));
      return response.data;
    } catch (error) {
      throw new BadRequestException({
        message: 'Get token detail failed',
        validatorErrors: EError.DEXHUNTER_GET_TOKEN_DETAIL_FAILED,
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

  async estimateSwap(payload: EsitmateSwapPayload): Promise<DexHunterEsitmateSwapResponse> {
    try {
      const response = await firstValueFrom(
        this.client.post<DexHunterEsitmateSwapResponse>('swap/estimate', payload, {
          timeout: 10000,
        }),
      );
      return response.data;
    } catch (error) {
      throw new BadRequestException({
        message: 'Estimate swap failed',
        validatorErrors: EError.DEXHUNTER_ESTIMATE_SWAP_FAILED,
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
   * @param blacklistedDexes - List of DEXes to exclude from the swap
   * @param maxIterations - Maximum iterations for binary search (default: 15)
   * @param tolerance - Acceptable difference from desired output (default: 0.01 = 1%)
   */
  async estimateRequiredInput(
    desiredOutputAmount: string,
    tokenIn: string,
    tokenInDecimals: number,
    tokenOut: string,
    slippage: number,
    blacklistedDexes: string[] = [],
  ): Promise<{ estimatedInput: string; actualOutput: string }> {
    const desiredOutput = parseFloat(desiredOutputAmount);
    if (tokenIn === CARDANO_LOVELACE_UNIT) {
      tokenIn = '';
    }

    if (tokenOut === CARDANO_LOVELACE_UNIT) {
      tokenOut = '';
    }
    // Strategy: Use a small tokenIn amount to get the price, then extrapolate
    // Start with a reasonable guess (e.g., 100 lovelace)
    const smallSample = 10;

    const sampleEstimate = await this.estimateSwap({
      amount_in: smallSample,
      token_in: tokenIn,
      token_out: tokenOut,
      slippage,
      blacklisted_dexes: blacklistedDexes,
    });

    // Calculate total input from splits
    const sampleInput = smallSample;
    // Calculate total output from splits
    const sampleOutput = sampleEstimate.total_output;

    // Calculate how much input is needed per unit of output
    const inputPerOutput = sampleInput / sampleOutput;

    // Calculate the estimated input needed for desired output
    // Using Math.ceil to ensure we get at least the desired output
    const estimatedInput = desiredOutput * inputPerOutput * (1 + slippage / 100);

    return {
      estimatedInput: estimatedInput.toFixed(tokenInDecimals),
      actualOutput: (estimatedInput / inputPerOutput).toFixed(0),
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
    const response = await firstValueFrom(this.client.post<BuildSwapResponse>('swap/build', payload));
    return response.data;
  }

  async submitSwap(payload: SubmitSwapPayload): Promise<SubmitSwapResponse> {
    const response = await firstValueFrom(this.client.post<SubmitSwapResponse>('swap/sign', payload));
    return response.data;
  }
}
