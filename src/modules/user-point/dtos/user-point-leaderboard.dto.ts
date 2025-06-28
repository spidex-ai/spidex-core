import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@shared/dtos/page-meta.dto';
import { Expose, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export enum EUserPointLeaderboardPeriod {
  DAILY = 'daily',
}

export class UserPointLeaderboardParamsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: EUserPointLeaderboardPeriod })
  @IsOptional()
  @IsEnum(EUserPointLeaderboardPeriod)
  period?: EUserPointLeaderboardPeriod;
}

export class LeaderBoardUserDetailOutputDto {
  @ApiProperty()
  @IsString()
  @Expose()
  id: number;

  @ApiProperty()
  @IsString()
  @Expose()
  username: string;

  @ApiProperty()
  @IsString()
  @Expose()
  fullName: string;

  @ApiProperty()
  @IsString()
  @Expose()
  avatar: string;

  @ApiProperty()
  @IsString()
  @Expose()
  address?: string;

  @ApiProperty()
  @IsString()
  @Expose()
  email?: string;

  @ApiProperty()
  @IsString()
  @Expose()
  xUsername?: string;
}

export class LeaderboardUserOutputDto {
  @ApiProperty()
  @IsNumber()
  @Expose()
  rank: number;

  @ApiProperty()
  @Type(() => LeaderBoardUserDetailOutputDto)
  @Expose()
  user: LeaderBoardUserDetailOutputDto;

  @ApiProperty()
  @IsString()
  @Expose()
  totalPoint: string;

  @ApiProperty()
  @IsNumber()
  @Expose()
  totalReferralCount: number;
}

export class LeaderboardOutputDto {
  @ApiPropertyOptional()
  @Type(() => LeaderboardUserOutputDto)
  @Expose()
  currentRank?: LeaderboardUserOutputDto;

  @ApiProperty()
  @Type(() => LeaderboardUserOutputDto)
  @Expose()
  leaderboard: LeaderboardUserOutputDto[];
}

export class LeaderboardStatsOutputDto {
  @ApiProperty()
  @IsNumber()
  @Expose()
  totalUsers: number;

  @ApiProperty()
  @IsNumber()
  @Expose()
  totalPoints: number;

  @ApiProperty()
  @IsNumber()
  @Expose()
  // Tỉ lệ point mà 1% người dùng đạt được
  p1Point: number;
}
