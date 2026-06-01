import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';
import type { RegisterRequest } from '@kodira/types';

export class RegisterDto implements RegisterRequest {
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

  @ApiProperty({ example: 'kodi_dev' })
  @IsString()
  @Length(3, 20)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'username must contain only letters, numbers and underscores',
  })
  username!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 80)
  fullName?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Código de referido (opcional).',
  })
  @IsOptional()
  @IsString()
  @Length(4, 32)
  referralCode?: string | null;
}

