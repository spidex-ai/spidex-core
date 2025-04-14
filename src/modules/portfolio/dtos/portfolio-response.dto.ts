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
    address?: string;

    @ApiProperty({ type: () => [BlockfrostAmountDto] })
    amount?: BlockfrostAmountDto[];

    @ApiProperty()
    stakeAddress?: string;

    @ApiProperty()
    type?: string;

    @ApiProperty()
    script?: boolean;

    @ApiProperty()
    totalPrice?: number;

    @ApiProperty()
    totalUsdPrice?: number;
}

export class PortfolioTransactionResponse {
    @ApiProperty()
    txHash: string

    @ApiProperty()
    txIndex: number

    @ApiProperty()
    blockHeight: number

    @ApiProperty()
    blockTime: number
}