import { EError } from '@constants/error.constant';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { BadRequestException } from '@shared/exception';
import { SwapWalletPayload } from 'external/dexhunter/types';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DHAPIService {
  constructor(private readonly client: HttpService) {}
  async swapWallet(payload: SwapWalletPayload): Promise<void> {
    console.log(payload);
    try {
      const response = await firstValueFrom(this.client.post<void>('swap/wallet', payload));
      return response.data;
    } catch (error) {
      throw new BadRequestException({
        message: 'Swap wallet failed',
        validatorErrors: EError.DEXHUNTER_SWAP_WALLET_FAILED,
        data: error.message,
      });
    }
  }
}
