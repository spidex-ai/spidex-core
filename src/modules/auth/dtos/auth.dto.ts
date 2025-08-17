import { Transform } from 'class-transformer';
import { IsEthereumAddress, IsJWT, IsNotEmpty, IsString, isString } from 'class-validator';

import { toChecksumAddress } from 'web3-utils';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConnectWalletRequestDto {
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'Wallet signature of the challenge message received from /auth/wallet/nonce',
    example:
      '0xce2c1751efd522ac0bec22c4eb2d00725d40d55580b60f15482cd751395c7deb5d60c8c0e09b80982b49c0e026225390bb0b3ca3e4b85711b5d382ae3b1306221c',
  })
  signature: string;

  @IsNotEmpty()
  @IsEthereumAddress()
  @ApiProperty({
    type: String,
    description: 'Wallet address',
    example: '0x0716869cff3be29a5f538eeb3e994a6d9f1ac056',
  })
  @Transform(({ value }) => {
    return isString(value) ? toChecksumAddress(value) : value;
  })
  address: string;

  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'Authentication nonce received from /auth/wallet/nonce endpoint',
    example: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890123456',
  })
  nonce: string;

  // @ApiProperty({
  //   type: String,
  //   description: 'referral code',
  //   example: 12374484,
  // })
  // @IsOptional()
  // referralCode: number;
}

export class ConnectWalletResponseDto {
  @ApiProperty({
    type: String,
  })
  accessToken: string;

  @ApiProperty({
    type: String,
  })
  refreshToken: string;

  @ApiProperty({
    type: String,
  })
  signature: string;
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

export class RefreshTokenResponseDto {
  @ApiProperty({
    type: String,
    description: 'Access token',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImpvaG4iLCJpYXQiOjE2NzkzOTI4NDAsImV4cCI6MTY3OTk5NzY0MH0._Jj0t_m7Vp4awrdlFDoM7bQt4gxvtXC8tSsCQGQFB84',
  })
  accessToken: string;

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

  @ApiPropertyOptional({
    type: String,
    description: 'pub key',
    example: '0xfb68891B8505b91f74c1568FBfe55368BfD98b72',
  })
  pubKey?: string;
}
