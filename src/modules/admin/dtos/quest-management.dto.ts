import { EQuestCategory, EQuestStatus, EQuestType, TQuestRequirement } from '@database/entities/quest.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@shared/dtos/page-meta.dto';
import { IsValidIcon } from '@shared/validators/icon.validator';
import { Expose, Transform, Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateQuestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Quest name',
    example: 'Daily Login Quest',
  })
  name: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Quest description',
    example: 'Login daily to earn points',
  })
  description?: string;

  @IsString()
  @IsOptional()
  @IsValidIcon()
  @ApiPropertyOptional({
    description: 'Quest icon URL or relative path',
    example: 'https://example.com/icons/daily-login.png',
  })
  icon?: string;

  @IsEnum(EQuestCategory)
  @ApiProperty({
    description: 'Quest category',
    enum: EQuestCategory,
    example: EQuestCategory.DAILY,
  })
  category: EQuestCategory;

  @IsEnum(EQuestType)
  @ApiProperty({
    description: 'Quest type',
    enum: EQuestType,
    example: EQuestType.DAILY_LOGIN,
  })
  type: EQuestType;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'Quest requirements (JSON object)',
    example: { url: 'https://twitter.com/spidex' },
  })
  requirements?: TQuestRequirement;

  @IsNumber()
  @Min(1)
  @ApiProperty({
    description: 'Quest completion limit',
    example: 1,
  })
  limit: number;

  @IsNumber()
  @Min(0)
  @ApiProperty({
    description: 'Points awarded for quest completion',
    example: 10,
  })
  points: number;

  @IsEnum(EQuestStatus)
  @ApiProperty({
    description: 'Quest status',
    enum: EQuestStatus,
    example: EQuestStatus.ACTIVE,
  })
  status: EQuestStatus;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    description: 'Quest start date',
    example: '2024-01-01T00:00:00.000Z',
  })
  startDate?: Date;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    description: 'Quest end date',
    example: '2024-12-31T23:59:59.999Z',
  })
  endDate?: Date;
}

export class UpdateQuestDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Quest name',
    example: 'Updated Daily Login Quest',
  })
  name?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Quest description',
    example: 'Updated description for daily login',
  })
  description?: string;

  @IsString()
  @IsOptional()
  @IsValidIcon()
  @ApiPropertyOptional({
    description: 'Quest icon URL or relative path',
    example: 'https://example.com/icons/updated-daily-login.png',
  })
  icon?: string;

  @IsEnum(EQuestCategory)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Quest category',
    enum: EQuestCategory,
    example: EQuestCategory.DAILY,
  })
  category?: EQuestCategory;

  @IsEnum(EQuestType)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Quest type',
    enum: EQuestType,
    example: EQuestType.DAILY_LOGIN,
  })
  type?: EQuestType;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'Quest requirements (JSON object)',
    example: { url: 'https://twitter.com/spidex' },
  })
  requirements?: TQuestRequirement;

  @IsNumber()
  @Min(1)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Quest completion limit',
    example: 1,
  })
  limit?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Points awarded for quest completion',
    example: 15,
  })
  points?: number;

  @IsEnum(EQuestStatus)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Quest status',
    enum: EQuestStatus,
    example: EQuestStatus.ACTIVE,
  })
  status?: EQuestStatus;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    description: 'Quest start date',
    example: '2024-01-01T00:00:00.000Z',
  })
  startDate?: Date;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    description: 'Quest end date',
    example: '2024-12-31T23:59:59.999Z',
  })
  endDate?: Date;
}

export class QuestFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Search by quest name',
    example: 'Daily',
  })
  name?: string;

  @IsOptional()
  @IsEnum(EQuestCategory)
  @Transform(({ value }) => (value ? +value : undefined))
  @ApiPropertyOptional({
    description: 'Filter by quest category',
    enum: EQuestCategory,
    example: EQuestCategory.DAILY,
  })
  category?: EQuestCategory;

  @IsOptional()
  @IsEnum(EQuestType)
  @Transform(({ value }) => (value ? +value : undefined))
  @ApiPropertyOptional({
    description: 'Filter by quest type',
    enum: EQuestType,
    example: EQuestType.DAILY_LOGIN,
  })
  type?: EQuestType;

  @IsOptional()
  @IsEnum(EQuestStatus)
  @Transform(({ value }) => (value ? +value : undefined))
  @ApiPropertyOptional({
    description: 'Filter by quest status',
    enum: EQuestStatus,
    example: EQuestStatus.ACTIVE,
  })
  status?: EQuestStatus;
}

export class QuestResponseDto {
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
  @ApiProperty({ required: false })
  icon?: string;

  @Expose()
  @ApiProperty({ enum: EQuestCategory })
  category: EQuestCategory;

  @Expose()
  @ApiProperty({ enum: EQuestType })
  type: EQuestType;

  @Expose()
  @ApiProperty()
  requirements?: TQuestRequirement;

  @Expose()
  @ApiProperty()
  limit: number;

  @Expose()
  @ApiProperty()
  points: number;

  @Expose()
  @ApiProperty({ enum: EQuestStatus })
  status: EQuestStatus;

  @Expose()
  @ApiProperty()
  startDate?: Date;

  @Expose()
  @ApiProperty()
  endDate?: Date;

  @Expose()
  @ApiProperty()
  completedUsersCount: number;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;
}
