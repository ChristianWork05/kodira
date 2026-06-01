import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import type { ForgotPasswordRequest } from '@kodira/types';

export class ForgotPasswordDto implements ForgotPasswordRequest {
  @ApiProperty({ example: 'user@mail.com' })
  @IsEmail()
  email!: string;
}

