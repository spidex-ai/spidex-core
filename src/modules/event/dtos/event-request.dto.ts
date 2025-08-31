import { EEventStatus, EEventType } from '@modules/event/event.constant';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateEventRankPrizeDto {
  @ApiProperty({ description: 'Starting rank for this prize tier' })
  @IsInt()
  @Min(1)
  rankFrom: number;

  @ApiProperty({ description: 'Ending rank for this prize tier' })
  @IsInt()
  @Min(1)
  rankTo: number;

  @ApiProperty({ description: 'Prize points amount' })
  @IsString()
  @IsNotEmpty()
  prizePoints: string;

  @ApiPropertyOptional({ description: 'Prize token ID' })
  @IsOptional()
  @IsString()
  prizeToken?: string;

  @ApiPropertyOptional({ description: 'Prize token amount' })
  @IsOptional()
  @IsString()
  prizeTokenAmount?: string;

  @ApiPropertyOptional({ description: 'Prize description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateEventDto {
  @ApiProperty({ description: 'Event name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Event description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Total prize pool amount' })
  @IsString()
  @IsNotEmpty()
  totalPrize: string;

  @ApiProperty({ description: 'Event start date' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Event end date' })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    enum: EEventType,
    description: 'Event type',
    default: EEventType.TRADING_COMPETITION,
  })
  @IsEnum(EEventType)
  @IsOptional()
  type?: EEventType = EEventType.TRADING_COMPETITION;

  @ApiProperty({
    type: [String],
    description: 'Array of token IDs that count for this event',
  })
  @IsArray()
  @IsString()
  tradeToken: string;

  @ApiProperty({
    type: [CreateEventRankPrizeDto],
    description: 'Prize structure by rank',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEventRankPrizeDto)
  rankPrizes: CreateEventRankPrizeDto[];

  @ApiPropertyOptional({ description: 'Event icon URL' })
  @IsOptional()
  @IsString()
  icon?: string;
}

export class UpdateEventDto {
  @ApiPropertyOptional({ description: 'Event name' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ description: 'Event description' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiPropertyOptional({ description: 'Total prize pool amount' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  totalPrize?: string;

  @ApiPropertyOptional({ description: 'Event start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Event end date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    enum: EEventType,
    description: 'Event type',
  })
  @IsOptional()
  @IsEnum(EEventType)
  type?: EEventType;

  @ApiPropertyOptional({
    type: [String],
    description: 'Array of token IDs that count for this event',
  })
  @IsOptional()
  @IsArray()
  @IsString()
  tradeToken?: string;

  @ApiPropertyOptional({
    type: [CreateEventRankPrizeDto],
    description: 'Prize structure by rank',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEventRankPrizeDto)
  rankPrizes?: CreateEventRankPrizeDto[];

  @ApiPropertyOptional({ description: 'Event icon URL' })
  @IsOptional()
  @IsString()
  icon?: string;
}

export class UpdateEventStatusDto {
  @ApiProperty({
    enum: EEventStatus,
    description: 'New event status',
  })
  @IsEnum(EEventStatus)
  status: EEventStatus;
}

export enum EventFilterStatus {
  UPCOMING = 'upcoming',
  LIVE = 'live',
  ENDED = 'ended',
  DISTRIBUTED = 'distributed',
}
export class EventFilterDto {
  @ApiPropertyOptional({
    enum: EventFilterStatus,
    description: 'Filter by event status',
  })
  @IsOptional()
  @IsEnum(EventFilterStatus)
  status?: EventFilterStatus;
}

export class LeaderboardFilterDto {
  @ApiPropertyOptional({
    description: 'Number of entries to return',
    minimum: 1,
    maximum: 200,
    default: 50,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;

  @ApiPropertyOptional({
    description: 'Number of entries to skip',
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @ApiPropertyOptional({ description: 'Minimum volume to include in leaderboard' })
  @IsOptional()
  @IsString()
  minVolume?: string;
}

export class JoinEventDto {
  @ApiPropertyOptional({ description: 'Optional referral code' })
  @IsOptional()
  @IsString()
  referralCode?: string;
}
