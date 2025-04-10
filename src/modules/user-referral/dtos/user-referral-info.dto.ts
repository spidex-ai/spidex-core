import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsNumber, IsString } from "class-validator";

export class ReferralInfoOutput {
  @ApiProperty()
  @IsString()
  @Expose()
  referralCode: string;

  @ApiProperty()
  @IsNumber()
  @Expose()
  referralUserCount: number;

  @ApiProperty()
  @IsNumber()
  @Expose()
  referralPointEarned: number;
}
