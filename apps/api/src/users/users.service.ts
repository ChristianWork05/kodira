import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { UserRole } from '@kodira/types';
import { User } from './schemas/user.schema';
import type { UserDocument } from './schemas/user.schema';

export interface CreateUserParams {
  email: string;
  passwordHash: string;
  username: string;
  fullName?: string | null;
  referralCode: string;
  referredBy?: string | null;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async create(params: CreateUserParams): Promise<UserDocument> {
    try {
      const created = await this.userModel.create({
        email: params.email,
        passwordHash: params.passwordHash,
        username: params.username,
        fullName: params.fullName ?? null,
        referralCode: params.referralCode,
        referredBy: params.referredBy ?? null,
      });

      return created;
    } catch (err: any) {
      if (err?.code === 11000) {
        const key = Object.keys(err?.keyPattern ?? {})[0] ?? 'field';
        throw new ConflictException({
          code: 'CONFLICT',
          message: `Duplicate ${key}`,
          details: { key },
        });
      }
      throw err;
    }
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+passwordHash +refreshTokenHash +refreshTokenExpiresAt')
      .exec();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ username: username.toLowerCase() })
      .exec();
  }

  async findById(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId).exec();
  }

  async findByIdWithRefresh(userId: string): Promise<UserDocument | null> {
    return this.userModel
      .findById(userId)
      .select('+refreshTokenHash +refreshTokenExpiresAt')
      .exec();
  }

  async findByReferralCode(referralCode: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ referralCode })
      .exec();
  }

  async findByEmailVerificationTokenHash(
    tokenHash: string,
    now: Date,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        emailVerificationTokenHash: tokenHash,
        emailVerificationTokenExpiresAt: { $gt: now },
      })
      .exec();
  }

  async findByPasswordResetTokenHash(
    tokenHash: string,
    now: Date,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        passwordResetTokenHash: tokenHash,
        passwordResetTokenExpiresAt: { $gt: now },
      })
      .exec();
  }

  async updateProfile(
    userId: string,
    update: Partial<Pick<
      User,
      | 'username'
      | 'fullName'
      | 'avatarUrl'
      | 'bio'
      | 'preferredLanguage'
      | 'timezone'
      | 'country'
    >>,
  ): Promise<UserDocument> {
    try {
      const updated = await this.userModel
        .findByIdAndUpdate(
          userId,
          {
            ...(update.username ? { username: update.username.toLowerCase() } : {}),
            ...(update.fullName !== undefined ? { fullName: update.fullName } : {}),
            ...(update.avatarUrl !== undefined ? { avatarUrl: update.avatarUrl } : {}),
            ...(update.bio !== undefined ? { bio: update.bio } : {}),
            ...(update.preferredLanguage !== undefined
              ? { preferredLanguage: update.preferredLanguage }
              : {}),
            ...(update.timezone !== undefined ? { timezone: update.timezone } : {}),
            ...(update.country !== undefined ? { country: update.country } : {}),
          },
          { new: true },
        )
        .exec();

      if (!updated) throw new NotFoundException();
      return updated;
    } catch (err: any) {
      if (err?.code === 11000) {
        const key = Object.keys(err?.keyPattern ?? {})[0] ?? 'field';
        throw new ConflictException({
          code: 'CONFLICT',
          message: `Duplicate ${key}`,
          details: { key },
        });
      }
      throw err;
    }
  }

  async addRole(userId: string, role: UserRole): Promise<UserDocument> {
    const updated = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $addToSet: { roles: role } },
        { new: true },
      )
      .exec();
    if (!updated) throw new NotFoundException();
    return updated;
  }

  async setRefreshTokenHash(
    userId: string,
    refreshTokenHash: string | null,
    refreshTokenExpiresAt?: Date | null,
  ): Promise<void> {
    await this.userModel
      .updateOne(
        { _id: userId },
        {
          refreshTokenHash,
          ...(refreshTokenExpiresAt !== undefined
            ? { refreshTokenExpiresAt }
            : {}),
        },
      )
      .exec();
  }

  async setEmailVerificationToken(
    userId: string,
    tokenHash: string | null,
    expiresAt: Date | null,
  ): Promise<void> {
    await this.userModel
      .updateOne(
        { _id: userId },
        {
          emailVerificationTokenHash: tokenHash,
          emailVerificationTokenExpiresAt: expiresAt,
        },
      )
      .exec();
  }

  async setPasswordResetToken(
    userId: string,
    tokenHash: string | null,
    expiresAt: Date | null,
  ): Promise<void> {
    await this.userModel
      .updateOne(
        { _id: userId },
        {
          passwordResetTokenHash: tokenHash,
          passwordResetTokenExpiresAt: expiresAt,
        },
      )
      .exec();
  }

  async setPasswordHash(userId: string, passwordHash: string): Promise<void> {
    await this.userModel
      .updateOne({ _id: userId }, { passwordHash })
      .exec();
  }
}

