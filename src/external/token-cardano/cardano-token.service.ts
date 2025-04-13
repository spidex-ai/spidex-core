import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import {
    BatchTokenCardanoInfo,
    TokenCardanoInfo
} from './types';
@Injectable()
export class TokenCardanoService {
    constructor(private readonly client: HttpService) { }

    async batchTokenInfo(tokens: string[]): Promise<BatchTokenCardanoInfo> {
        const response = await firstValueFrom(this.client.post<BatchTokenCardanoInfo>('metadata/query', {
            subjects: tokens,
        }));
        return response.data;
    }

    async tokenInfo(token: string): Promise<TokenCardanoInfo> {
        const response = await firstValueFrom(this.client.get<TokenCardanoInfo>(`metadata/${token}`));
        return response.data;
    }

}