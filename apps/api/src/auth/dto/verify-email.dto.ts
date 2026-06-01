import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import type { VerifyEmailRequest } from '@kodira/types';

export class VerifyEmailDto implements VerifyEmailRequest {
  @ApiProperty()
  @IsString()
  @Length(20, 500)
  token!: string;
}

