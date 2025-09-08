import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class ZealyWebhookPayloadAccount {
  @ApiProperty()
  @IsOptional()
  @IsString()
  wallet?: string;
}
export class ZealyWebhookPayload {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsString()
  communityId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  subdomain?: string;

  @ApiProperty()
  @IsString()
  questId: string;

  @ApiProperty()
  @IsString()
  requestId: string;

  @ApiProperty()
  @IsOptional()
  @Type(() => ZealyWebhookPayloadAccount)
  accounts?: ZealyWebhookPayloadAccount;
}

export interface ZealyWebhookResponse {
  success: boolean;
  message: string;
}

export interface ZealyWebhookErrorResponse {
  success: boolean;
  message: string;
}
