import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UpdateProfileResponseDto {
  @ApiProperty()
  walletAddress: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  bio: string;

  @ApiProperty()
  avatar: string;

  @ApiProperty()
  status: string;
}

export class GetProfileResponseDto {
  @ApiProperty()
  walletAddress: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  bio: string;

  @ApiProperty()
  avatar: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  id: string;

  // @ApiProperty()
  // likedReceived: number;

  // @ApiProperty()
  // mentionsReceived: number;

  // @ApiProperty()
  // numberFollower: number;
}

export class GetOtherProfileResponseDto {
  @ApiProperty()
  walletAddress: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  bio: string;

  @ApiProperty()
  avatar: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  isFollowing: boolean;
}

export class GetMyRepliesResponseDto {
  @ApiProperty()
  tokenId: number;

  @ApiProperty()
  replyId: number;

  @ApiProperty()
  replyUserId: number;

  @ApiProperty()
  content: string;

  @ApiProperty()
  image: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  userName: string;

  @ApiProperty()
  avatar: string;

  @ApiProperty()
  walletAddress: string;
}

export class GetFollowingResponseDto {
  @ApiProperty()
  wallet_address: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  bio: string;

  @ApiProperty()
  avatar: string;

  @ApiProperty()
  numberFollower: number;

  @ApiProperty()
  isFollowing: boolean;
}

export class GetFollowerResponseDto extends GetFollowingResponseDto {}

export class FollowUserResponseDto {
  @ApiProperty()
  userId: number;

  @ApiProperty()
  targetUserId: number;
}

export class PostCommentResponseDto {
  @ApiProperty()
  userId: number;

  @ApiProperty()
  tokenId: number;

  @ApiProperty()
  replyId: number;

  @ApiProperty()
  replyUserId: number;

  @ApiProperty()
  content: string;

  @ApiProperty()
  image: string;
}

export class LikeCommentResponseDto {
  @ApiProperty()
  userId: number;

  @ApiProperty()
  commentId: number;
}

export class GetNotificationResponseDto {
  @ApiProperty()
  userId: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  information: JSON;
}

export class TokenTradingSettingResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  slippage: string;

  @ApiProperty()
  fontRunning: boolean;

  @ApiProperty()
  priorityFee: string;
}

export class UserProfileResponseDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  fullName: string;

  @ApiProperty()
  @Expose()
  username: string;

  @ApiProperty()
  @Expose()
  bio: string;

  @ApiProperty()
  @Expose()
  avatar: string;

  @ApiProperty()
  @Expose()
  status: string;

  @ApiProperty()
  @Expose()
  xLink: string;

  @ApiProperty()
  @Expose()
  discordLink: string;

  @ApiProperty()
  @Expose()
  telegramLink: string;

  @ApiProperty()
  @Expose()
  agentCount: number;

  @ApiProperty()
  @Expose()
  totalUses: number;

  @ApiProperty()
  @Expose()
  rating: number;
}

export class GetLoginManagementResponseDto {
  @ApiProperty()
  @Expose()
  walletAddress: string;

  @ApiProperty()
  @Expose()
  email: string;

  @ApiProperty()
  @Expose()
  xUsername: string;
}
