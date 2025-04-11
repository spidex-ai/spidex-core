import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class BuildSwapRequest {
    @IsString()
    @IsNotEmpty()
    buyerAddress: string;

    @IsOptional()
    @IsString()
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

    @IsArray()
    @IsOptional()
    blacklistedDexes: string[];
}

export class SubmitSwapRequest {
    @IsString()
    @IsNotEmpty()
    txCbor: string

    @IsString()
    @IsNotEmpty()
    signatures: string
}

export class GetPoolStatsRequest {
    @IsString()
    @IsNotEmpty()
    tokenIn: string;

    @IsString()
    @IsNotEmpty()
    tokenOut: string;
}