import { EError } from '@constants/error.constant';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { BadRequestException } from '@shared/exception';
import {
  BlockfrostAddressDetail,
  BlockfrostTokenDetail,
  BlockfrostTransaction,
  BlockfrostTransactionCbor,
  BlockfrostTransactionDetail,
} from 'external/blockfrost/types';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class BlockfrostService {
  private submitTxToBytes = true;
  constructor(private readonly client: HttpService) {}

  async getAddressDetail(address: string): Promise<BlockfrostAddressDetail> {
    try {
      const response = await firstValueFrom(this.client.get<BlockfrostAddressDetail>(`addresses/${address}`));
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return BlockfrostAddressDetail.empty(address);
      }
      throw new BadRequestException({
        message: 'Get address detail failed',
        validatorErrors: EError.BLOCKFROST_GET_ADDRESS_DETAIL_FAILED,
        data: error.message,
      });
    }
  }

  async getTransactions(
    address: string,
    page: number = 1,
    count: number = 20,
    order: 'asc' | 'desc' = 'desc',
  ): Promise<BlockfrostTransaction[]> {
    try {
      const response = await firstValueFrom(
        this.client.get<BlockfrostTransaction[]>(`addresses/${address}/transactions`, {
          params: {
            page,
            count,
            order,
          },
        }),
      );
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return [];
      }
      throw new BadRequestException({
        message: 'Get transactions failed',
        validatorErrors: EError.BLOCKFROST_GET_TRANSACTIONS_FAILED,
        data: error.message,
      });
    }
  }

  async getTokenDetail(tokenId: string) {
    try {
      const response = await firstValueFrom(this.client.get<BlockfrostTokenDetail>(`assets/${tokenId}`));
      return response.data;
    } catch (error) {
      throw new BadRequestException({
        message: 'Get token detail failed',
        validatorErrors: EError.BLOCKFROST_GET_TOKEN_DETAIL_FAILED,
        data: error.message,
      });
    }
  }

  async getTransactionDetail(txHash: string) {
    try {
      const response = await firstValueFrom(this.client.get<BlockfrostTransactionDetail>(`txs/${txHash}`));
      return response.data;
    } catch (error) {
      throw new BadRequestException({
        message: 'Get transaction detail failed',
        validatorErrors: EError.BLOCKFROST_GET_TRANSACTION_DETAIL_FAILED,
        data: error.message,
      });
    }
  }

  async getTransactionCbor(txHash: string) {
    try {
      const response = await firstValueFrom(this.client.get<BlockfrostTransactionCbor>(`txs/${txHash}/cbor`));
      return response?.data?.cbor;
    } catch (error) {
      throw new BadRequestException({
        message: 'Get transaction cbor failed',
        validatorErrors: EError.BLOCKFROST_GET_TRANSACTION_CBOR_FAILED,
        data: error.message,
      });
    }
  }

  async submitTx(tx: string): Promise<string> {
    try {
      const headers = { 'Content-Type': 'application/cbor' };
      const { data, status } = await firstValueFrom(
        this.client.post('tx/submit', this.submitTxToBytes ? this.toBytes(tx) : tx, {
          headers,
        }),
      );

      if (status === 200 || status == 202) {
        return data;
      }

      throw new BadRequestException({
        message: 'Submit transaction failed',
        validatorErrors: EError.BLOCKFROST_SUBMIT_TRANSACTION_FAILED,
        data: '<BLOCKFROST_SUBMIT_TRANSACTION_FAILED>',
      });
    } catch (error) {
      throw new BadRequestException({
        message: 'Submit transaction failed',
        validatorErrors: EError.BLOCKFROST_SUBMIT_TRANSACTION_FAILED,
        data: error.message,
      });
    }
  }

  toBytes(tx: string): Uint8Array {
    return new Uint8Array(Buffer.from(tx, 'hex'));
  }
}
