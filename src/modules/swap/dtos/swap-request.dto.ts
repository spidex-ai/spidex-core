import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import { CardexscanToken } from 'external/cardexscan/types';

export class BuildDexhunterSwapRequest {
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  addresses: string[];

  @IsString()
  @IsOptional()
  tokenIn: string;

  @IsString()
  @IsOptional()
  tokenOut: string;

  @IsNumber()
  @IsOptional()
  slippage: number;

  @IsNumber()
  @IsNotEmpty()
  amountIn: number;

  @IsBoolean()
  @IsOptional()
  txOptimization: boolean;

  @IsArray()
  @IsOptional()
  blacklistedDexes: string[];
}

export class BuildMinswapSwapEstimateRequest {
  @ApiProperty({
    type: String,
    description: 'Amount in',
    example: '1000000',
  })
  @IsString()
  @IsNotEmpty()
  amount: string;

  @ApiProperty({
    type: String,
    description: 'Token in',
    example: 'lovelace',
  })
  @IsString()
  @IsNotEmpty()
  token_in: string;

  @ApiProperty({
    type: String,
    description: 'Token out',
    example: 'lovelace',
  })
  @IsString()
  @IsNotEmpty()
  token_out: string;

  @ApiProperty({
    type: Number,
    description: 'Slippage',
    example: 0.01,
  })
  slippage: number;
}

export class BuildMinswapSwapRequest {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'Sender address',
    example: 'addr1q8...',
  })
  sender: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'Minimum amount out',
    example: '1000000',
  })
  min_amount_out: string;

  @IsObject()
  @IsNotEmpty()
  @ApiProperty({
    type: BuildMinswapSwapEstimateRequest,
    description: 'Estimate',
    example: {
      amount: '1000000',
      token_in: 'lovelace',
      token_out: 'lovelace',
      slippage: 0.01,
    },
  })
  estimate: BuildMinswapSwapEstimateRequest;
}

export class EstimateSwapRequest {
  @IsString()
  @IsOptional()
  tokenIn: string;

  @IsString()
  @IsOptional()
  tokenOut: string;

  @IsNumber()
  @IsOptional()
  slippage: number;

  @IsNumber()
  @IsOptional()
  amountIn: number;
}

export class EstimateRequiredInputRequest {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'Input token identifier',
    example: 'lovelace',
  })
  tokenIn: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'Output token identifier',
    example: '29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c64d494e',
  })
  tokenOut: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'Desired output amount',
    example: '10000',
  })
  desiredOutputAmount: string;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({
    type: Number,
    description: 'Slippage tolerance in percentage',
    example: 0.5,
    default: 0.5,
  })
  slippage?: number;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    type: Boolean,
    description: 'Allow multi-hop swaps (only for Minswap)',
    example: true,
    default: true,
  })
  allowMultiHops?: boolean;
}

export class SubmitSwapRequest {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'Cbor transaction',
    example: 'cbor_transaction_data',
  })
  txCbor: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Transaction hash',
    example: 'tx_hash_example',
  })
  @IsString()
  @IsOptional()
  signatures: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    type: String,
    description: 'Signed transaction',
    example: 'cbor_transaction_data',
  })
  signedTx?: string;
}

export class BuildCardexscanSwapRequest {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    type: Number,
    description: 'Token in amount',
    example: 1000000,
  })
  tokenInAmount: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    type: Number,
    description: 'Slippage',
    example: 0.01,
  })
  slippage: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'Token in',
    example: 'lovelace',
  })
  tokenIn: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'Token out',
    example: 'lovelace',
  })
  tokenOut: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'Sender address',
    example: 'addr1q8...',
  })
  sender: string;
}

export class GetPoolStatsRequest {
  @IsString()
  @IsNotEmpty()
  tokenIn: string;

  @IsString()
  @IsNotEmpty()
  tokenOut: string;
}

export interface TokenDBInfo {
  unit: string;
  name: string;
  price: number;
}

export interface MinswapTokenDBInfo extends TokenDBInfo {
  unitSwap: string;
}

export type CardexscanTokenInfo = CardexscanToken | string;
