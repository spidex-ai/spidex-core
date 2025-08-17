import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum EUserPointRankOrderBy {
  POINT = 'point',
  REFERRAL = 'referral',
}

export class UserPointRankQueryDto {
  @ApiProperty({ enum: EUserPointRankOrderBy })
  @IsEnum(EUserPointRankOrderBy)
  orderBy: EUserPointRankOrderBy = EUserPointRankOrderBy.POINT;
}
