import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseOutputDto {
  @ApiProperty({
    type: String,
  })
  accessToken: string;

  @ApiProperty({
    type: String,
  })
  refreshToken: string;

  @ApiProperty()
  userId: number;
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

export class GenerateNonceResponseDto {
  @ApiProperty({
    type: String,
    description: 'Generated nonce for wallet authentication',
    example: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890123456',
  })
  nonce: string;

  @ApiProperty({
    type: String,
    description: 'Challenge message to be signed by the wallet',
    example:
      'Sign this message to authenticate with Spidex:\n\nWallet: 0xe2FE03a0af021Db52750Fc895E1B626F84f2aE0D\nNonce: a1b2c3d4e5f6...\nTimestamp: 1640995200000\nExpires: 2024-01-01T12:00:00.000Z\n\nThis request will expire in 15 minutes.',
  })
  challengeMessage: string;

  @ApiProperty({
    type: String,
    description: 'Expiration time of the nonce in ISO format',
    example: '2024-01-01T12:15:00.000Z',
  })
  expiresAt: string;
}
