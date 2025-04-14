import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { BlockfrostAddressDetail, BlockfrostTokenDetail, BlockfrostTransactionDetail } from "external/blockfrost/types";
import { firstValueFrom } from "rxjs";

@Injectable()
export class BlockfrostService {
    constructor(private readonly client: HttpService) { }

    async getAddressDetail(address: string): Promise<BlockfrostAddressDetail | null> {
        try {
            const response = await firstValueFrom(this.client.get<BlockfrostAddressDetail>(`addresses/${address}`));
            return response.data;
        } catch (error) {
            if (error.response.status === 404) {
                return null
            }
            throw error
        }
    }

    async getTransactions(address: string, page: number = 1, count: number = 20, order: 'asc' | 'desc' = 'desc') {
        const response = await firstValueFrom(this.client.get<any>(`addresses/${address}/transactions`, {
            params: {
                page,
                count,
                order
            }
        }));
        return response.data;
    }

    async getTokenDetail(tokenId: string) {
        const response = await firstValueFrom(this.client.get<BlockfrostTokenDetail>(`assets/${tokenId}`));
        return response.data;
    }

    async getTransactionDetail(txHash: string) {
        const response = await firstValueFrom(this.client.get<BlockfrostTransactionDetail>(`txs/${txHash}`));
        return response.data;
    }
}
