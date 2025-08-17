import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

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

export class SubmitSwapRequest {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'Cbor transaction',
    example: 'cbor_transaction_data',
  })
  txCbor: string;

  @ApiProperty({
    type: String,
    description: 'Transaction hash',
    example: 'tx_hash_example',
  })
  @IsString()
  @IsNotEmpty()
  signatures: string;
}

export class GetPoolStatsRequest {
  @IsString()
  @IsNotEmpty()
  tokenIn: string;

  @IsString()
  @IsNotEmpty()
  tokenOut: string;
}
