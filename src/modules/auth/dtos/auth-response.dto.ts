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
