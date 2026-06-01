import { ApiProperty } from '@nestjs/swagger';
import type { AuthResponse } from '@kodira/types';
import { UserMeDto } from '../../users/dto/user-me.dto';
import { AuthTokensDto } from './auth-tokens.dto';

export class AuthResponseDto implements AuthResponse {
  @ApiProperty({ type: AuthTokensDto })
  tokens!: AuthTokensDto;

  @ApiProperty({ type: UserMeDto })
  user!: UserMeDto;
}

