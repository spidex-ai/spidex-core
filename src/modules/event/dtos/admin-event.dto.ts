import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { IsDateString, IsOptional, IsString } from 'class-validator';
import { EEventStatus, EEventType } from '@modules/event/event.constant';
import { PageOptionsDto } from '@shared/dtos/page-option.dto';

export class AdminEventFilterDto extends PageOptionsDto {
  @ApiPropertyOptional({
    enum: EEventStatus,
    description: 'Filter by event status',
  })
  @IsOptional()
  status?: EEventStatus;

  @ApiPropertyOptional({
    enum: EEventType,
    description: 'Filter by event type',
  })
  @IsOptional()
  type?: EEventType;

  @ApiPropertyOptional({ description: 'Filter events created from this date' })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({ description: 'Filter events created to this date' })
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional({ description: 'Search in event name and description' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class AdminEventResponseDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  description: string;

  @ApiProperty()
  @Expose()
  totalPrize: string;

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => value?.toISOString())
  startDate: string;

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => value?.toISOString())
  endDate: string;

  @ApiProperty({ enum: EEventStatus })
  @Expose()
  status: EEventStatus;

  @ApiProperty({ enum: EEventType })
  @Expose()
  type: EEventType;

  @ApiProperty({ type: String })
  @Expose()
  tradeToken: string;

  @ApiPropertyOptional()
  @Expose()
  icon?: string;

  @ApiProperty()
  @Expose()
  participantCount: number;

  @ApiProperty()
  @Expose()
  totalVolumeTraded: string;

  @ApiProperty()
  @Expose()
  totalTrades: number;

  @ApiPropertyOptional()
  @Expose()
  createdBy?: number;

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => value?.toISOString())
  createdAt: string;

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => value?.toISOString())
  updatedAt: string;
}

export class TopTraderDto {
  @ApiProperty()
  @Expose()
  userId: number;

  @ApiPropertyOptional()
  @Expose()
  username?: string;

  @ApiPropertyOptional()
  @Expose()
  walletAddress?: string;

  @ApiProperty()
  @Expose()
  totalVolume: string;

  @ApiProperty()
  @Expose()
  tradeCount: number;

  @ApiProperty()
  @Expose()
  rank: number;
}

export class DailyVolumeDto {
  @ApiProperty()
  @Expose()
  date: string;

  @ApiProperty()
  @Expose()
  volume: string;

  @ApiProperty()
  @Expose()
  trades: number;
}

export class TokenDistributionDto {
  @ApiProperty()
  @Expose()
  token: string;

  @ApiProperty()
  @Expose()
  volume: string;

  @ApiProperty()
  @Expose()
  percentage: number;

  @ApiProperty()
  @Expose()
  trades: number;
}

export class EventAnalyticsResponseDto {
  @ApiProperty()
  @Expose()
  eventId: number;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty({ enum: EEventStatus })
  @Expose()
  status: EEventStatus;

  @ApiProperty()
  @Expose()
  totalParticipants: number;

  @ApiProperty()
  @Expose()
  totalVolumeTraded: string;

  @ApiProperty()
  @Expose()
  totalTrades: number;

  @ApiProperty()
  @Expose()
  averageVolumePerParticipant: string;

  @ApiProperty()
  @Expose()
  uniqueTokensTraded: number;

  @ApiProperty({ type: [TopTraderDto] })
  @Expose()
  @Type(() => TopTraderDto)
  topTraders: TopTraderDto[];

  @ApiProperty({ type: [DailyVolumeDto] })
  @Expose()
  @Type(() => DailyVolumeDto)
  dailyVolumeChart: DailyVolumeDto[];

  @ApiProperty({ type: [TokenDistributionDto] })
  @Expose()
  @Type(() => TokenDistributionDto)
  tokenDistribution: TokenDistributionDto[];

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => value?.toISOString())
  generatedAt: string;
}

export class PrizeDistributionEntryDto {
  @ApiProperty()
  @Expose()
  userId: number;

  @ApiProperty()
  @Expose()
  rank: number;

  @ApiPropertyOptional()
  @Expose()
  username?: string;

  @ApiPropertyOptional()
  @Expose()
  walletAddress?: string;

  @ApiPropertyOptional()
  @Expose()
  prizePoints?: string;

  @ApiPropertyOptional()
  @Expose()
  prizeToken?: string;

  @ApiPropertyOptional()
  @Expose()
  prizeTokenAmount?: string;

  @ApiProperty()
  @Expose()
  success: boolean;

  @ApiPropertyOptional()
  @Expose()
  error?: string;
}

export class PrizeDistributionResultDto {
  @ApiProperty()
  @Expose()
  eventId: number;

  @ApiProperty()
  @Expose()
  totalDistributions: number;

  @ApiProperty()
  @Expose()
  successfulDistributions: number;

  @ApiProperty()
  @Expose()
  failedDistributions: number;

  @ApiProperty({ type: [PrizeDistributionEntryDto] })
  @Expose()
  @Type(() => PrizeDistributionEntryDto)
  distributions: PrizeDistributionEntryDto[];

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => value?.toISOString())
  distributedAt: string;

  @ApiProperty()
  @Expose()
  distributedBy: number;
}
