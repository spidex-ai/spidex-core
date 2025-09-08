import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { BatchTokenCardanoInfo, TokenCardanoInfo, TokenCardanoInfoSubject } from './types';
import { BadRequestException } from '@shared/exception';
import { EError } from '@constants/error.constant';
@Injectable()
export class TokenCardanoService {
  constructor(private readonly client: HttpService) {}

  async batchTokenInfo(tokens: string[]): Promise<BatchTokenCardanoInfo> {
    try {
      const response = await firstValueFrom(
        this.client.post<BatchTokenCardanoInfo>('subjects/query', {
          subjects: tokens,
        }),
      );
      return response.data;
    } catch (error) {
      console.error(error);
      throw new BadRequestException({
        message: 'Batch token info failed',
        validatorErrors: EError.CARDANO_TOKEN_BATCH_INFO_FAILED,
        data: error.message,
      });
    }
  }

  async tokenInfo(token: string): Promise<TokenCardanoInfoSubject> {
    try {
      const response = await firstValueFrom(this.client.get<TokenCardanoInfo>(`subjects/${token}`));
      return response.data.subject;
    } catch (error) {
      throw new BadRequestException({
        message: 'Token info failed',
        validatorErrors: EError.CARDANO_TOKEN_INFO_FAILED,
        data: error.message,
      });
    }
  }
}
