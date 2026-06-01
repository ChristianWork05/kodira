export const USER_ROLES = ['student', 'instructor', 'mentor', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface UserMe {
  id: string;
  email: string;
  username: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  roles: UserRole[];
  emailVerified: boolean;
  preferredLanguage?: string | null;
  timezone?: string | null;
  country?: string | null;
  xp: number;
  currentStreak: number;
  referralCode: string;
  referralCredits: number;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicUserProfile {
  id: string;
  username: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  roles: UserRole[];
  xp: number;
  currentStreak: number;
  createdAt: string;
}

export interface UpdateMyProfileRequest {
  username?: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  preferredLanguage?: string | null;
  timezone?: string | null;
  country?: string | null;
}

