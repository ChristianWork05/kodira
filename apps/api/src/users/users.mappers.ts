import type { PublicUserProfile, UserMe } from '@kodira/types';
import type { UserDocument } from './schemas/user.schema';

export function toUserMe(user: UserDocument): UserMe {
  return {
    id: user._id.toString(),
    email: user.email,
    username: user.username,
    fullName: user.fullName ?? null,
    avatarUrl: user.avatarUrl ?? null,
    bio: user.bio ?? null,
    roles: user.roles,
    emailVerified: user.emailVerified,
    preferredLanguage: user.preferredLanguage ?? null,
    timezone: user.timezone ?? null,
    country: user.country ?? null,
    xp: user.xp,
    currentStreak: user.currentStreak,
    referralCode: user.referralCode,
    referralCredits: user.referralCredits,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    createdAt: (user as any).createdAt
      ? new Date((user as any).createdAt).toISOString()
      : new Date().toISOString(),
    updatedAt: (user as any).updatedAt
      ? new Date((user as any).updatedAt).toISOString()
      : new Date().toISOString(),
  };
}

export function toPublicUserProfile(user: UserDocument): PublicUserProfile {
  return {
    id: user._id.toString(),
    username: user.username,
    fullName: user.fullName ?? null,
    avatarUrl: user.avatarUrl ?? null,
    bio: user.bio ?? null,
    roles: user.roles,
    xp: user.xp,
    currentStreak: user.currentStreak,
    createdAt: (user as any).createdAt
      ? new Date((user as any).createdAt).toISOString()
      : new Date().toISOString(),
  };
}

