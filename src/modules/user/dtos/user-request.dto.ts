import { EFollowUser, EUserStatus } from '@constants/user.constant';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EnumFieldOptional } from '@shared/decorators/field.decorator';
import { PageOptionsWithSearchDto } from '@shared/dtos/page-option-with-search.dto';
import { Expose, Transform, Type } from 'class-transformer';
import { IsBoolean, IsEthereumAddress, IsNumber, IsOptional, isString, IsString, Matches } from 'class-validator';
import { toChecksumAddress } from 'web3-utils';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => String)
  @IsString()
  fullName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => String)
  @IsString()
  username: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => String)
  @IsString()
  bio: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => String)
  @IsString()
  avatar: string;
}

export class UpdateStatusUserDto {
  @ApiProperty()
  @EnumFieldOptional(() => EUserStatus, {
    default: EUserStatus.INACTIVE,
  })
  status: EUserStatus;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  userId: number;
}

export class GetNotificationDto extends PageOptionsWithSearchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId: number;
}

export class GetFollowingDto extends PageOptionsWithSearchDto {
  @ApiProperty()
  @Type(() => String)
  @IsString()
  walletAddress: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => String)
  @IsString()
  viewerId: number;
}

export class GetFollowerDto extends GetFollowingDto { }

export class GetMyRepliesDto extends PageOptionsWithSearchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId: number;
}

export class FollowUserDto {
  @ApiProperty()
  @EnumFieldOptional(() => EFollowUser, {
    default: EFollowUser.FOLLOW,
  })
  isFollow: EFollowUser;
}

export class PostCommentDto {
  @ApiProperty()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId: number;

  @ApiProperty()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  tokenId: number;

  @ApiProperty()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  replyId: number;

  @ApiProperty()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  replyUserId: number;

  @ApiProperty()
  @IsOptional()
  @Type(() => String)
  @IsString()
  content: string;

  @ApiProperty()
  @IsOptional()
  @Type(() => String)
  @IsString()
  image: string;
}

export class LikeCommentDto {
  @ApiProperty()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId: number;

  @ApiProperty()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  commentId: number;
}

export class GetOtherProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  currentUserId: number;
}

export class UserViewTokenDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  tokenId: number;
}

export class TokenTradingSettingDto {
  @ApiProperty()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id: number;

  @ApiProperty()
  @Type(() => String)
  @IsString()
  slippage: string;

  @ApiProperty()
  @Type(() => Boolean)
  @IsBoolean()
  fontRunning: boolean;

  @ApiProperty()
  @Type(() => String)
  @IsString()
  priorityFee: string;
}

export class UpdateCreateTokenFeeDto {
  @ApiProperty()
  @Type(() => String)
  @IsString()
  createTokenFee: string;
}

export class UpdateRainTokenAddressDto {
  @ApiProperty()
  @IsEthereumAddress()
  @Transform(({ value }) => {
    return isString(value) ? toChecksumAddress(value) : value;
  })
  tokenAddress: string;
}
