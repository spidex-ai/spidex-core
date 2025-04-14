import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { SearchTokenInfo, TokenDetail, PoolStatsResponse, EsitmateSwapPayload, DexHunterEsitmateSwapResponse, BuildSwapResponse, SwapPayload, SubmitSwapPayload, SubmitSwapResponse } from "external/dexhunter/types";
import { firstValueFrom } from "rxjs";

@Injectable()
export class DexhunterService {
    constructor(private readonly client: HttpService) { }
    /**
 * Get market stats
 * @param quote - Quote currency (default: ADA)
 * @returns Promise with market stats
 */
    async searchToken(query: string, verified: boolean = true, page: number = 0, limit: number = 10): Promise<SearchTokenInfo[]> {
        const response = await firstValueFrom(this.client.get<SearchTokenInfo[]>('swap/tokens', { params: { query, verified, page, limit } }));
        const paginatedData = response.data.slice(page * limit, (page + 1) * limit).filter(token => token.is_verified === verified);
        return paginatedData;
    }

    async getTokenDetail(tokenId: string): Promise<TokenDetail> {
        const response = await firstValueFrom(this.client.get<TokenDetail>(`swap/token/${tokenId}`));
        return response.data;
    }

    async poolStats(tokenIn: string, tokenOut: string): Promise<PoolStatsResponse[]> {
        const response = await firstValueFrom(this.client.get<PoolStatsResponse[]>(`stats/pools/${tokenIn}/${tokenOut}`));
        return response.data;
    }

    async estimateSwap(payload: EsitmateSwapPayload): Promise<DexHunterEsitmateSwapResponse> {
        const response = await firstValueFrom(this.client.post<DexHunterEsitmateSwapResponse>('swap/estimate', payload));
        return response.data;
    }

    async buildSwap(payload: SwapPayload): Promise<BuildSwapResponse> {
        const response = await firstValueFrom(this.client.post<BuildSwapResponse>('swap/build', payload));
        return response.data;
    }

    async submitSwap(payload: SubmitSwapPayload): Promise<SubmitSwapResponse> {
        const response = await firstValueFrom(this.client.post<SubmitSwapResponse>('swap/sign', payload));
        return response.data;
    }
}
