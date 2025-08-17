import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsDateString, IsEnum, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export enum AnalyticsTimeframe {
  ONE_DAY = '1d',
  SEVEN_DAYS = '7d',
  THIRTY_DAYS = '30d',
  ALL_TIME = 'all',
}

export enum AnalyticsTimeRange {
  ONE_DAY = '1d',
  SEVEN_DAYS = '7d',
  THIRTY_DAYS = '30d',
}

export class GetDailyActiveUsersDto {
  @ApiPropertyOptional({
    description: 'Date in YYYY-MM-DD format (default: current date)',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Time range for analysis',
    enum: AnalyticsTimeRange,
    default: AnalyticsTimeRange.ONE_DAY,
  })
  @IsOptional()
  @IsEnum(AnalyticsTimeRange)
  timeRange?: AnalyticsTimeRange;

  @ApiPropertyOptional({
    description: 'Include detailed user activity information',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeDetails?: boolean;
}

export class GetTopUsersDto {
  @ApiPropertyOptional({
    description: 'Timeframe for analysis',
    enum: AnalyticsTimeframe,
    default: AnalyticsTimeframe.ONE_DAY,
  })
  @IsOptional()
  @IsEnum(AnalyticsTimeframe)
  timeframe?: AnalyticsTimeframe;

  @ApiPropertyOptional({
    description: 'Number of top users to return (max 100)',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number;
}

export class UserActivityDto {
  @ApiProperty()
  userId: number;

  @ApiPropertyOptional()
  username?: string;

  @ApiProperty()
  lastActivity: Date;

  @ApiProperty()
  activityType: string;
}

export class DailyActiveUsersResponseDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  activeUsers: number;

  @ApiPropertyOptional({ type: [UserActivityDto] })
  details?: UserActivityDto[];
}

export class TopVolumeUserDto {
  @ApiProperty()
  userId: number;

  @ApiPropertyOptional()
  username?: string;

  @ApiProperty()
  totalVolume: number;

  @ApiProperty()
  transactionCount: number;
}

export class TopSilkPointUserDto {
  @ApiProperty()
  userId: number;

  @ApiPropertyOptional()
  username?: string;

  @ApiProperty()
  silkPoints: number;

  @ApiPropertyOptional()
  pointsEarned?: number;
}

export class TopReferralUserDto {
  @ApiProperty()
  userId: number;

  @ApiPropertyOptional()
  username?: string;

  @ApiProperty()
  referralCount: number;

  @ApiPropertyOptional()
  referralRewards?: number;
}
