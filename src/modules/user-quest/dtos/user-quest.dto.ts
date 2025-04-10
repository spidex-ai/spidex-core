import { EQuestCategory, EQuestType, TQuestRequirement } from "@database/entities/quest.entity";
import { ApiProperty } from "@nestjs/swagger";
import { PaginationDto } from "@shared/dtos/page-meta.dto";
import { Expose } from "class-transformer";
import { IsDateString } from "class-validator";



export enum EUserQuestStatus {
  COMPLETED = 1,
  NOT_COMPLETED = 0,
}

export class GetCheckInListFilterDto {
  @Expose()
  @ApiProperty({
    type: Date,
    example: new Date().toISOString(),
    default: new Date()
  })
  @IsDateString()
  startDate: Date

  @Expose()
  @ApiProperty({
    type: Date,
    example: new Date().toISOString(),
    default: new Date()
  })
  @IsDateString()
  endDate: Date
}

export class UserQuestFilterDto extends PaginationDto {

}

export class UserQuestProgress {
  @Expose()
  @ApiProperty()
  current: number;
  @Expose()
  @ApiProperty()
  target: number;
}

export class UserQuestInfoOutput {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty()
  description: string;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  category: EQuestCategory;

  @Expose()
  @ApiProperty()
  type: EQuestType;

  @Expose()
  @ApiProperty()
  requirements: TQuestRequirement

  @Expose()
  @ApiProperty()
  point: number

  @Expose()
  @ApiProperty()
  progress: UserQuestProgress

  @Expose()
  @ApiProperty()
  status: EUserQuestStatus
}

export class UserQuestOutput {
  @Expose()
  @ApiProperty()
  quests: UserQuestInfoOutput[]

  @Expose()
  @ApiProperty()
  resetAt: Date
}
