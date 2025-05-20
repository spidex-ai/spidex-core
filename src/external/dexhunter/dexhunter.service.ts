import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { DexHunterSearchTokenInfo, DexHunterTokenDetail, PoolStatsResponse, EsitmateSwapPayload, DexHunterEsitmateSwapResponse, BuildSwapResponse, SwapPayload, SubmitSwapPayload, SubmitSwapResponse, SwapWalletPayload } from "external/dexhunter/types";
import { firstValueFrom } from "rxjs";
import { filter } from "lodash";
import { BadRequestException } from "@shared/exception";
import { EError } from "@constants/error.constant";

@Injectable()
export class DexhunterService {
    constructor(private readonly client: HttpService) { }
    /**
 * Get market stats
 * @param quote - Quote currency (default: ADA)
 * @returns Promise with market stats
 */
    async searchToken(query: string, verified: boolean = true, page: number = 0, limit: number = 10): Promise<DexHunterSearchTokenInfo[]> {
        try {
            const response = await firstValueFrom(this.client.get<DexHunterSearchTokenInfo[]>('swap/tokens', { params: { query, verified, page, limit } }));
            if (!response.data) {
                return [];
            }
            const fakeADAUnit = 'c2c25c82aa1ca031fc27d95f871f99bb3a39c4d263645721b2304397414441';
            const paginatedData = filter(response.data, token => {
                if (token.token_id === fakeADAUnit) {
                    return false
                }
                return token.is_verified === verified
            })

            return paginatedData
        } catch (error) {
            throw new BadRequestException({
                message: 'Search token failed',
                validatorErrors: EError.DEXHUNTER_SEARCH_TOKEN_FAILED,
                data: error
            });
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
                data: error
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
                data: error
            });
        }
    }

    async estimateSwap(payload: EsitmateSwapPayload): Promise<DexHunterEsitmateSwapResponse> {
        try {
            const response = await firstValueFrom(this.client.post<DexHunterEsitmateSwapResponse>('swap/estimate', payload));
            return response.data;
        } catch (error) {
            throw new BadRequestException({
                message: 'Estimate swap failed',
                validatorErrors: EError.DEXHUNTER_ESTIMATE_SWAP_FAILED,
                data: error
            });
        }
    }

    async swapWallet(payload: SwapWalletPayload): Promise<void> {
        try {
            const response = await firstValueFrom(this.client.post<void>('swap/wallet', payload));
            return response.data;
        } catch (error) {
            throw new BadRequestException({
                message: 'Swap wallet failed',
                validatorErrors: EError.DEXHUNTER_SWAP_WALLET_FAILED,
                data: error
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
