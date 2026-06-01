import { ApiProperty } from '@nestjs/swagger';
import type { UserMe, UserRole } from '@kodira/types';

export class UserMeDto implements UserMe {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'user@mail.com' })
  email!: string;

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

  @ApiProperty({ example: false })
  emailVerified!: boolean;

  @ApiProperty({ nullable: true })
  preferredLanguage?: string | null;

  @ApiProperty({ nullable: true })
  timezone?: string | null;

  @ApiProperty({ nullable: true })
  country?: string | null;

  @ApiProperty({ example: 0 })
  xp!: number;

  @ApiProperty({ example: 0 })
  currentStreak!: number;

  @ApiProperty({ example: 'AB12CD34' })
  referralCode!: string;

  @ApiProperty({ example: 0 })
  referralCredits!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ nullable: true })
  lastLoginAt?: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

