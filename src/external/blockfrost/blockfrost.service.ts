import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { BlockfrostAddressDetail, BlockfrostTokenDetail, BlockfrostTransaction, BlockfrostTransactionDetail } from "external/blockfrost/types";
import { firstValueFrom } from "rxjs";

@Injectable()
export class BlockfrostService {
    constructor(private readonly client: HttpService) { }

    async getAddressDetail(address: string): Promise<BlockfrostAddressDetail> {
        try {
            const response = await firstValueFrom(this.client.get<BlockfrostAddressDetail>(`addresses/${address}`));
            return response.data;
        } catch (error) {
            if (error.response.status === 404) {
                return BlockfrostAddressDetail.empty(address)
            }
            throw error
        }
    }

    async getTransactions(address: string, page: number = 1, count: number = 20, order: 'asc' | 'desc' = 'desc'): Promise<BlockfrostTransaction[]> {
        try {
            const response = await firstValueFrom(this.client.get<BlockfrostTransaction[]>(`addresses/${address}/transactions`, {
                params: {
                    page,
                    count,
                    order
                }
            }));
            return response.data;
        } catch (error) {
            if (error.response.status === 404) {
                return []
            }
            throw error
        }
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
