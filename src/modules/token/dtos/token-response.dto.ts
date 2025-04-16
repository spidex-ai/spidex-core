import { ApiProperty } from "@nestjs/swagger"
import { IsNumber } from "class-validator"


export class TokenMcap {
    @ApiProperty()
    @IsNumber()
    circSupply: number

    @ApiProperty()
    @IsNumber()
    fdv: number

    @ApiProperty()
    mcap: number

    @ApiProperty()
    @IsNumber()
    price: number

    @ApiProperty()
    ticker: string

    @ApiProperty()
    totalSupply: number
}

export class TokenN24h {
    @ApiProperty()
    @IsNumber()
    buyVolume: number

    @ApiProperty()
    @IsNumber()
    buyers: number

    @ApiProperty()
    @IsNumber()
    buys: number

    @ApiProperty()
    @IsNumber()
    sellVolume: number

    @ApiProperty()
    @IsNumber()
    sellers: number

    @ApiProperty()
    @IsNumber()
    sells: number
}


export class TokenStatsResponse {
    @ApiProperty()
    @IsNumber()
    price: number

    @ApiProperty()
    @IsNumber()
    usdPrice: number

    @ApiProperty()
    mcap: TokenMcap

    @ApiProperty()
    @IsNumber()
    holders: number

    @ApiProperty()
    "24h": TokenN24h
}


export class TokenTradesResponse {
    @ApiProperty()
    action: string

    @ApiProperty()
    address: string

    @ApiProperty()
    exchange: string

    @ApiProperty()
    hash: string

    @ApiProperty()
    lpTokenUnit: string

    @ApiProperty()
    price: number

    @ApiProperty()
    totalPrice: number

    @ApiProperty()
    usdTotalPrice: number

    @ApiProperty()
    time: number

    @ApiProperty()
    tokenA: string

    @ApiProperty()
    tokenAAmount: number

    @ApiProperty()
    tokenAName: string

    @ApiProperty()
    tokenB: string

    @ApiProperty()
    tokenBAmount: number

    @ApiProperty()
    tokenBName: string
}


export class TokenTopHoldersResponse {
    @ApiProperty()
    address: string

    @ApiProperty()
    amount: number

    @ApiProperty()
    ownershipPercentage: number

    @ApiProperty()
    totalPrice: number

    @ApiProperty()
    usdTotalPrice: number
}

export class TokenDetailsResponse {
    @ApiProperty()
    unit: string

    @ApiProperty()
    policy: string

    @ApiProperty()
    ticker: string

    @ApiProperty()
    is_verified: boolean

    @ApiProperty()
    creation_date: string

    @ApiProperty()
    logo?: string

    @ApiProperty()
    total_supply: number

    @ApiProperty()
    decimals: number

    @ApiProperty()
    price: number

    @ApiProperty()
    usdPrice: number

    @ApiProperty()
    name: string

    @ApiProperty()
    description: string
}