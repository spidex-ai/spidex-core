import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsString } from 'class-validator';

export enum EUserPointLeaderboardOrderBy {
  POINT = 'point',
  REFERRAL = 'referral',
}

export class UserPointLeaderboardQueryDto {
  @ApiProperty({ enum: EUserPointLeaderboardOrderBy })
  @IsEnum(EUserPointLeaderboardOrderBy)
  orderBy: EUserPointLeaderboardOrderBy = EUserPointLeaderboardOrderBy.POINT;
}

export enum EUserPointLeaderboardPeriod {
  DAILY = 'daily',
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
