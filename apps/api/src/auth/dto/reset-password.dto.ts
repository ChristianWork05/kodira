import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';
import type { ResetPasswordRequest } from '@kodira/types';

export class ResetPasswordDto implements ResetPasswordRequest {
  @ApiProperty()
  @IsString()
  @Length(20, 500)
  token!: string;

  @ApiProperty({
    description: 'Min 8 chars y al menos 1 número.',
    example: 'newpass1',
  })
  @IsString()
  @Length(8, 128)
  @Matches(/^(?=.*\d).{8,}$/, {
    message:
      'newPassword must be at least 8 chars and include at least one number',
  })
  newPassword!: string;
}

