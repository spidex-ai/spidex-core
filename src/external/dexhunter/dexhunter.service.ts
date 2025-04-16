import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { DexHunterSearchTokenInfo, DexHunterTokenDetail, PoolStatsResponse, EsitmateSwapPayload, DexHunterEsitmateSwapResponse, BuildSwapResponse, SwapPayload, SubmitSwapPayload, SubmitSwapResponse } from "external/dexhunter/types";
import { firstValueFrom } from "rxjs";

@Injectable()
export class DexhunterService {
    constructor(private readonly client: HttpService) { }
    /**
 * Get market stats
 * @param quote - Quote currency (default: ADA)
 * @returns Promise with market stats
 */
    async searchToken(query: string, verified: boolean = true, page: number = 0, limit: number = 10): Promise<DexHunterSearchTokenInfo[]> {
        const response = await firstValueFrom(this.client.get<DexHunterSearchTokenInfo[]>('swap/tokens', { params: { query, verified, page, limit } }));
        if (!response.data) {
            return [];
        }
        const paginatedData = response.data.slice(page * limit, (page + 1) * limit).filter(token => token.is_verified === verified);
        return paginatedData;
    }

    async getTokenDetail(tokenId: string): Promise<DexHunterTokenDetail> {
        const response = await firstValueFrom(this.client.get<DexHunterTokenDetail>(`swap/token/${tokenId}`));
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
