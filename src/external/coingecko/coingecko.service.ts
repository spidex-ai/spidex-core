import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { CoingeckoTokenPrice } from "external/coingecko/types";
import { firstValueFrom } from "rxjs";
import { BadRequestException } from "@shared/exception";
import { EError } from "@constants/error.constant";

@Injectable()
export class CoingeckoService {
    constructor(
        private readonly client: HttpService
    ) { }

    async getTokenPrice(ids: string[], vsCurrencies: string[]): Promise<CoingeckoTokenPrice> {
        try {
            const response = await firstValueFrom(this.client.get<CoingeckoTokenPrice>('simple/price', { params: { ids, vs_currencies: vsCurrencies.join(',') } }));
            return response.data;
        } catch (error) {
            throw new BadRequestException({
                message: 'Get token price failed',
                validatorErrors: EError.COINGECKO_GET_TOKEN_PRICE_FAILED,
                data: error
            });
        }
    }
}
