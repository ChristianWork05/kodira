import { ApiProperty } from '@nestjs/swagger';
import type { PublicUserProfile, UserRole } from '@kodira/types';

export class PublicUserProfileDto implements PublicUserProfile {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'kodi_dev' })
  username!: string;

  @ApiProperty({ nullable: true })
  fullName?: string | null;

  @ApiProperty({ nullable: true })
  avatarUrl?: string | null;

  @ApiProperty({ nullable: true })
  bio?: string | null;

  @ApiProperty({ isArray: true, example: ['student'] })
  roles!: UserRole[];

  @ApiProperty({ example: 0 })
  xp!: number;

  @ApiProperty({ example: 0 })
  currentStreak!: number;

  @ApiProperty()
  createdAt!: string;
}

