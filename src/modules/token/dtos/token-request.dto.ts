import { ApiProperty } from "@nestjs/swagger";
import { PaginationDto } from "@shared/dtos/page-meta.dto";
import { Transform } from "class-transformer";
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export enum ETimeFrame {
    ONE_HOUR = '1h',
    FOUR_HOUR = '4h',
    TWELVE_HOUR = '12h',
    ONE_DAY = '24h',
    SEVEN_DAYS = '7d',
    THIRTY_DAYS = '30d',
    ALL = 'all',
}

export class TokenTopTradersRequest extends PaginationDto {
    @ApiProperty({
        description: 'Time frame',
        example: ETimeFrame.ONE_HOUR,
    })
    @IsEnum(ETimeFrame)
    @IsNotEmpty()
    timeFrame: ETimeFrame;
}


export class TokenSearchRequest extends PaginationDto {
    @ApiProperty({
        description: 'Query',
        example: 'token',
    })
    @IsString()
    @IsNotEmpty()
    query: string;

    @ApiProperty({
        description: 'Verified',
        example: true,
    })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    verified: boolean;
}


export class TokenTopVolumeRequest extends PaginationDto {
    @ApiProperty({
        description: 'Time frame',
        example: ETimeFrame.ONE_HOUR,
    })
    @IsEnum(ETimeFrame)
    @IsNotEmpty()
    timeframe: ETimeFrame;
}

export class TokenTopMcapRequest extends PaginationDto {

}


export class TokenOHLCVRequest {
    @ApiProperty({
        description: 'Interval',
        example: '1h',
    })
    @IsString()
    @IsNotEmpty()
    interval: string;

    @ApiProperty({
        description: 'Number of intervals',
        example: 10,
    })
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @IsNotEmpty()
    numIntervals: number;
}