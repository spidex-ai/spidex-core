import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

export class UserReferredInfoOutput {
  @ApiProperty()
  @IsString()
  @Expose()
  id: number;

  @ApiPropertyOptional()
  @IsString()
  @Expose()
  username: string;

  @ApiPropertyOptional()
  @IsString()
  @Expose()
  avatar: string;

  @ApiProperty()
  @IsString()
  @Expose()
  totalReferralPointEarned: string;

  @ApiProperty()
  @Expose()
  createdAt: Date;
}

export class ReferralHistoryOutput {
  @ApiProperty()
  @IsString()
  @Expose()
  id: number;

  @ApiPropertyOptional()
  @IsString()
  @Expose()
  username: string;

  @ApiPropertyOptional()
  @IsString()
  @Expose()
  avatar: string;

  @ApiProperty()
  @IsString()
  @Expose()
  point: string;

  @ApiProperty()
  @Expose()
  createdAt: Date;
}
