import { EError } from '@constants/error.constant';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException } from '@shared/exception';
import { BlockfrostService } from 'external/blockfrost/blockfrost.service';
import { firstValueFrom } from 'rxjs';
import {
  CardexscanBuildSwapPayload,
  CardexscanBuildSwapResponse,
  CardexscanEstimateSwapPayload,
  CardexscanEstimateSwapResponse,
} from './types';

@Injectable()
export class CardexscanService {
  private readonly logger = new Logger(CardexscanService.name);

  constructor(
    private readonly client: HttpService,
    private readonly blockfrostService: BlockfrostService,
  ) {}

  async estimateSwap(payload: CardexscanEstimateSwapPayload): Promise<CardexscanEstimateSwapResponse> {
    try {
      this.logger.log('Estimating swap with Cardexscan', { payload });

      const response = await firstValueFrom(
        this.client.post<CardexscanEstimateSwapResponse>('/cds/swap/aggregate', payload),
      );

      if (response.data.error) {
        throw new BadRequestException({
          message: 'Failed to estimate swap',
          data: response.data.error,
          validatorErrors: EError.CARDEXSCAN_ESTIMATE_SWAP_FAILED,
        });
      }

      return response.data;
    } catch (error) {
      console.error(error);
      this.logger.error('Failed to estimate swap', JSON.stringify(error));
      throw new BadRequestException({
        message: 'Failed to estimate swap',
        data: error,
        validatorErrors: EError.CARDEXSCAN_ESTIMATE_SWAP_FAILED,
      });
    }
  }

  async buildSwap(payload: CardexscanBuildSwapPayload): Promise<CardexscanBuildSwapResponse> {
    try {
      this.logger.log('Building swap with Cardexscan', { payload });

      const response = await firstValueFrom(
        this.client.post<CardexscanBuildSwapResponse>('/cds/swap/cbor/build', payload),
      );

      if (response.data.error) {
        throw new BadRequestException({
          message: 'Failed to build swap',
          data: response.data.error,
          validatorErrors: EError.CARDEXSCAN_BUILD_SWAP_FAILED,
        });
      }

      return response.data;
    } catch (error) {
      this.logger.error('Failed to build swap', JSON.stringify(error));
      throw new BadRequestException({
        message: 'Failed to build swap',
        data: error,
        validatorErrors: EError.CARDEXSCAN_BUILD_SWAP_FAILED,
      });
    }
  }

  async submitSwap(signedTx: string): Promise<{ txHash: string }> {
    try {
      const data = await this.blockfrostService.submitTx(signedTx);
      return { txHash: data };
    } catch (error) {
      this.logger.error('Failed to submit swap', error);
      throw new BadRequestException({
        message: 'Failed to submit swap',
        data: error.response?.data,
        validatorErrors: EError.CARDEXSCAN_SUBMIT_SWAP_FAILED,
      });
    }
  }
}
