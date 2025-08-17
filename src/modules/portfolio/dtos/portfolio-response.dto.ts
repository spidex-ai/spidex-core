import { ApiProperty } from '@nestjs/swagger';

class BlockfrostAmountDto {
  @ApiProperty()
  unit: string;

  @ApiProperty()
  ticker: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  quantity: string;

  @ApiProperty()
  price?: number;

  @ApiProperty()
  usdPrice?: number;

  @ApiProperty()
  totalPrice?: number;

  @ApiProperty()
  usdTotalPrice?: number;

  @ApiProperty()
  logo?: string;
}

export class PortfolioAddressResponse {
  @ApiProperty()
  address: string;

  @ApiProperty({ type: () => [BlockfrostAmountDto] })
  amount: BlockfrostAmountDto[];

  @ApiProperty()
  totalPrice: number;

  @ApiProperty()
  totalUsdPrice: number;
}

export class PortfolioTransactionResponse {
  @ApiProperty()
  action: string;

  @ApiProperty()
  time: number;

  @ApiProperty()
  tokenA: string;

  @ApiProperty()
  tokenAName: string;

  @ApiProperty()
  tokenAIcon?: string;

  @ApiProperty()
  tokenAAmount: number;

  @ApiProperty()
  tokenB: string;

  @ApiProperty()
  tokenBName: string;

  @ApiProperty()
  tokenBAmount: number;

  @ApiProperty()
  tokenBIcon?: string;
}
