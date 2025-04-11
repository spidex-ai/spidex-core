import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { CoingeckoTokenPrice } from "external/coingecko/types";
import { firstValueFrom } from "rxjs";

@Injectable()
export class CoingeckoService {
    constructor(
        private readonly client: HttpService
    ) { }

    async getTokenPrice(ids: string[], vsCurrencies: string[]): Promise<CoingeckoTokenPrice> {
        const response = await firstValueFrom(this.client.get<CoingeckoTokenPrice>('simple/price', { params: { ids, vs_currencies: vsCurrencies.join(',') } }));
        return response.data;
    }
}
