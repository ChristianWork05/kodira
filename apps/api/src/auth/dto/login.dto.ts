import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, Matches } from 'class-validator';
import type { LoginRequest } from '@kodira/types';

export class LoginDto implements LoginRequest {
  @ApiProperty({ example: 'user@mail.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Min 8 chars y al menos 1 número.',
    example: 'password1',
  })
  @IsString()
  @Length(8, 128)
  @Matches(/^(?=.*\d).{8,}$/, {
    message: 'password must be at least 8 chars and include at least one number',
  })
  password!: string;
}

