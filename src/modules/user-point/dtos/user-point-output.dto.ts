import { AchievementOutput, NextAchievementOutput } from '@modules/achivement/dtos/achivement-output.dto';
import { ReferralInfoOutput } from '@modules/user-referral/dtos/user-referral-info.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

export class UserPointOutput {
  @ApiProperty()
  @Expose()
  @IsString()
  id: string;

  @ApiProperty()
  @Expose()
  @IsString()
  userId: string;

  @ApiProperty()
  @Expose()
  @IsString()
  amount: string;
}


export class UserPointInfoOutput {
  @ApiProperty()
  point: UserPointOutput

  @ApiProperty()
  referralInfo: ReferralInfoOutput

  @ApiProperty()
  achievements: AchievementOutput[]

  @ApiProperty()
  nextAchievement: NextAchievementOutput

  @ApiProperty()
  tradingVolume: number
}
