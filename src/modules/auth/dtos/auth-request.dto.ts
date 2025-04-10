import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsJWT, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ConnectWalletRequestDto {
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'Wallet signature',
    example:
      '0xa9d2e0e57f9b873676f71c7caf69b89ca556cb175e1fa5dc276ff58e40a07a93162e9f5837433cbe589491d51b72b7fb36626c6c3bf1cce2433c395ddb7f406f1b',
  })
  signature: string;

  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'Wallet address',
    example: '0xe2FE03a0af021Db52750Fc895E1B626F84f2aE0D',
  })
  address: string;

  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'Public key',
    example: 'ed25519_pk1...',
  })
  publicKey: string;

  @ApiPropertyOptional({ description: 'Referral code', example: 'referral-code' })
  @Expose()
  @IsOptional()
  referralCode?: string;
}

export class RefreshTokenRequestDto {
  @IsNotEmpty()
  @IsJWT()
  @ApiProperty({
    type: String,
    description: 'Refresh token',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImpvaG4iLCJpYXQiOjE2NzkzOTI4NDAsImV4cCI6MTY3OTk5NzY0MH0._Jj0t_m7Vp4awrdlFDoM7bQt4gxvtXC8tSsCQGQFB84',
  })
  refreshToken: string;
}

export class SignMessageRequestDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    type: String,
    description: 'private key',
    example: '8ee765ec2c235ad904ec55948e51f901aac0c77ca987355f1c781ef862c7ff82',
  })
  privateKey: string;
}



export class ConnectXRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  code: string;

  @IsNotEmpty()
  @ApiProperty()
  redirectUri: string;

  @ApiPropertyOptional({ description: 'Referral code', example: 'referral-code' })
  @Expose()
  @IsOptional()
  referralCode?: string;
}

export class ConnectXBodyDto {
  @ApiProperty()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsNotEmpty()
  username: string;

  @ApiPropertyOptional({ description: 'Referral code', example: 'referral-code' })
  @Expose()
  @IsOptional()
  referralCode?: string;
}

export class ConnectGoogleRequestDto {
  @ApiProperty({ description: 'Google id token', example: 'google-id-token' })
  @Expose()
  @IsNotEmpty()
  idToken: string;

  @ApiPropertyOptional({ description: 'Referral code', example: 'referral-code' })
  @Expose()
  @IsOptional()
  referralCode?: string;
}


export class ConnectGoogleBodyDto {
  @ApiProperty({ description: 'Google email', example: 'google-email' })
  @Expose()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ description: 'Referral code', example: 'referral-code' })
  @Expose()
  @IsOptional()
  referralCode?: string;
}
