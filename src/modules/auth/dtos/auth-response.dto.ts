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
      'Spidex Authentication - Wallet: addr1q8xcfx7wdlx9wr9vyz0y7wn02sp0nvu7zpjgsqmzln5gd0ju2dlhutnzc23navegy4gen7vftjjvkmcqt2qm9pz6m6rq3r0gyd - Nonce: a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890123456 - Timestamp: 1750490191433 - Expires: 2024-01-01T12:15:00.000Z',
  })
  challengeMessage: string;

  @ApiProperty({
    type: String,
    description: 'Expiration time of the nonce in ISO format',
    example: '2024-01-01T12:15:00.000Z',
  })
  expiresAt: string;
}
