import { ApiProperty } from '@nestjs/swagger';
import type { AuthTokens } from '@kodira/types';

export class AuthTokensDto implements AuthTokens {
  @ApiProperty({ example: 'Bearer' })
  tokenType!: 'Bearer';

  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ example: 900 })
  accessTokenExpiresInSeconds!: number;
}

