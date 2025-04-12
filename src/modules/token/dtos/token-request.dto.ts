import { ApiProperty } from "@nestjs/swagger";

export enum ETimeFrame {
    ONE_HOUR = '1h',
    FOUR_HOUR = '4h',
    TWELVE_HOUR = '12h',
    ONE_DAY = '24h',
    SEVEN_DAYS = '7d',
    THIRTY_DAYS = '30d',
    ALL = 'all',
}

export class TokenTopTradersRequest {
    @ApiProperty({
        description: 'Time frame',
        example: ETimeFrame.ONE_HOUR,
    })
    timeFrame: ETimeFrame;

    @ApiProperty({
        description: 'Limit',
        example: 10,
    })
    limit: number;

    @ApiProperty({
        description: 'Page',
        example: 1,
    })
    page: number;
}