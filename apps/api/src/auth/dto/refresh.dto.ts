import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import type { RefreshRequest } from '@kodira/types';

export class RefreshDto implements RefreshRequest {
  @ApiProperty()
  @IsString()
  @Length(20, 500)
  refreshToken!: string;
}

