import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { EEventStatus, EEventType } from '@modules/event/event.constant';

export class EventRankPrizeResponseDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  rankFrom: number;

  @ApiProperty()
  @Expose()
  rankTo: number;

  @ApiProperty()
  @Expose()
  prizePoints: string;

  @ApiPropertyOptional()
  @Expose()
  prizeToken?: string;

  @ApiPropertyOptional()
  @Expose()
  prizeTokenAmount?: string;

  @ApiPropertyOptional()
  @Expose()
  description?: string;
}

export class EventToken {
  unit: string;
  logo: string;
  name: string;
  ticker: string;
  decimals: number;
}

export class PrizeInfo {
  @ApiProperty()
  @Expose()
  unit: string;

  @ApiPropertyOptional()
  @Expose()
  logo?: string;

  @ApiPropertyOptional()
  @Expose()
  name?: string;

  @ApiPropertyOptional()
  @Expose()
  ticker?: string;

  @ApiProperty()
  @Expose()
  tokenAmount: string;

  @ApiProperty()
  @Expose()
  point: string;
}

export class Top3Prizes {
  @ApiPropertyOptional({ type: PrizeInfo })
  @Expose()
  @Type(() => PrizeInfo)
  firstPlace?: PrizeInfo;

  @ApiPropertyOptional({ type: PrizeInfo })
  @Expose()
  @Type(() => PrizeInfo)
  secondPlace?: PrizeInfo;

  @ApiPropertyOptional({ type: PrizeInfo })
  @Expose()
  @Type(() => PrizeInfo)
  thirdPlace?: PrizeInfo;
}

export class EventInfoResponseDto {
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

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => value?.toISOString())
  estimateDistributionDate: string;

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => value?.toISOString())
  distributionDate: string;

  @ApiProperty({ enum: EEventStatus })
  @Expose()
  status: EEventStatus;

  @ApiProperty({ enum: EEventType })
  @Expose()
  type: EEventType;

  @ApiProperty({ type: EventToken })
  @Expose()
  tradeToken: EventToken;

  @ApiPropertyOptional()
  @Expose()
  icon?: string;

  @ApiPropertyOptional()
  @Expose()
  banner?: string;

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
  url?: string;

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => value?.toISOString())
  createdAt: string;

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => value?.toISOString())
  updatedAt: string;
  @ApiPropertyOptional({ type: Top3Prizes })
  @Expose()
  @Type(() => Top3Prizes)
  top3Prizes?: Top3Prizes;
}

export class EventLeaderboardEntryDto {
  @ApiProperty()
  @Expose()
  userId: number;

  @ApiProperty()
  @Expose()
  rank: number;

  @ApiProperty()
  @Expose()
  totalVolume: string;

  @ApiProperty()
  @Expose()
  tradeCount: number;

  @ApiPropertyOptional()
  @Expose()
  username?: string;

  @ApiPropertyOptional()
  @Expose()
  walletAddress?: string;

  @ApiPropertyOptional()
  @Expose()
  avatarUrl?: string;

  @ApiPropertyOptional()
  @Expose()
  prizeInfo?: {
    points?: string;
    token?: EventToken;
    tokenAmount?: string;
  };

  @ApiPropertyOptional()
  @Expose()
  eventsParticipated?: number;
}

export class EventLeaderboardResponseDto {
  @ApiProperty()
  @Expose()
  eventId: number;

  @ApiProperty()
  @Expose()
  totalParticipants: number;

  @ApiProperty()
  @Expose()
  lastUpdated: string;

  @ApiProperty({ type: [EventLeaderboardEntryDto] })
  @Expose()
  @Type(() => EventLeaderboardEntryDto)
  leaderboard: EventLeaderboardEntryDto[];
}

export class EventParticipantResponseDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  userId: number;

  @ApiProperty()
  @Expose()
  totalVolume: string;

  @ApiProperty()
  @Expose()
  tradeCount: number;

  @ApiPropertyOptional()
  @Expose()
  rank?: number;

  @ApiProperty()
  @Expose()
  prizeClaimed: boolean;

  @ApiPropertyOptional()
  @Expose()
  @Transform(({ value }) => value?.toISOString())
  prizeClaimedAt?: string;

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => value?.toISOString())
  joinedAt: string;

  @ApiPropertyOptional()
  @Expose()
  @Transform(({ value }) => value?.toISOString())
  lastTradeAt?: string;
}

export class UserEventStatsResponseDto {
  @ApiProperty()
  @Expose()
  eventId: number;

  @ApiProperty()
  @Expose()
  userId: number;

  @ApiPropertyOptional()
  @Expose()
  username?: string;

  @ApiPropertyOptional()
  @Expose()
  walletAddress?: string;

  @ApiPropertyOptional()
  @Expose()
  avatarUrl?: string;

  @ApiProperty()
  @Expose()
  totalVolume: string;

  @ApiProperty()
  @Expose()
  tradeCount: number;

  @ApiPropertyOptional()
  @Expose()
  rank?: number;

  @ApiProperty()
  @Expose()
  isParticipating: boolean;

  @ApiPropertyOptional()
  @Expose()
  @Transform(({ value }) => value?.toISOString())
  joinedAt?: string;

  @ApiPropertyOptional()
  @Expose()
  @Transform(({ value }) => value?.toISOString())
  lastTradeAt?: string;

  @ApiPropertyOptional()
  @Expose()
  prizeInfo?: {
    points?: string;
    token?: string;
    tokenAmount?: string;
    claimed: boolean;
  };
}

export class EventStatsResponseDto {
  @ApiProperty()
  @Expose()
  totalEvents: number;

  @ApiProperty()
  @Expose()
  activeEvents: number;

  @ApiProperty()
  @Expose()
  totalParticipants: number;

  @ApiProperty()
  @Expose()
  totalVolumeTraded: string;

  @ApiProperty()
  @Expose()
  totalPrizesDistributed: string;
}

export class GlobalLeaderboardResponseDto {
  @ApiProperty()
  @Expose()
  totalParticipants: number;

  @ApiProperty()
  @Expose()
  lastUpdated: string;

  @ApiProperty({ type: [EventLeaderboardEntryDto] })
  @Expose()
  @Type(() => EventLeaderboardEntryDto)
  leaderboard: EventLeaderboardEntryDto[];
}

export class LeaderboardStatsDto {
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
  activeEvents: number;

  @ApiProperty()
  @Expose()
  lastUpdated: string;
}
