import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class GetPortfolioTransactionsQuery {
  @IsNumber()
  @IsOptional()
  @ApiProperty({ default: 1 })
  @Transform(({ value }) => Number(value))
  page: number = 1;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ default: 20 })
  @Transform(({ value }) => Number(value))
  count: number = 20;

  @IsOptional()
  @ApiProperty({ default: 'desc' })
  order: 'asc' | 'desc' = 'desc';
}
