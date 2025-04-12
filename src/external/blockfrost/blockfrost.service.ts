import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { BlockfrostAddressDetail } from "external/blockfrost/types";
import { firstValueFrom } from "rxjs";

@Injectable()
export class BlockfrostService {
    constructor(private readonly client: HttpService) { }

    async getAddressDetail(address: string) {
        const response = await firstValueFrom(this.client.get<BlockfrostAddressDetail>(`addresses/${address}`));
        return response.data;
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
}
