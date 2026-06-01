import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { UserRole } from '@kodira/types';
import { USER_ROLES } from '@kodira/types';
import type { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email!: string;

  @Prop({ type: String, required: true, select: false })
  passwordHash!: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  username!: string;

  @Prop({ type: String, default: null })
  fullName?: string | null;

  @Prop({ type: String, default: null })
  avatarUrl?: string | null;

  @Prop({ type: String, default: null })
  bio?: string | null;

  @Prop({
    type: [String],
    enum: USER_ROLES,
    default: ['student'],
  })
  roles!: UserRole[];

  @Prop({ type: Boolean, default: false })
  emailVerified!: boolean;

  @Prop({ type: String, default: null })
  preferredLanguage?: string | null;

  @Prop({ type: String, default: null })
  timezone?: string | null;

  @Prop({ type: String, default: null })
  country?: string | null;

  @Prop({ type: Number, default: 0 })
  xp!: number;

  @Prop({ type: Number, default: 0 })
  currentStreak!: number;

  @Prop({ type: String, required: true, unique: true, index: true })
  referralCode!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  referredBy?: Types.ObjectId | null;

  @Prop({ type: Number, default: 0 })
  referralCredits!: number;

  @Prop({ type: String, default: null })
  stripeCustomerId?: string | null;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ type: Date, default: null })
  lastLoginAt?: Date | null;

  @Prop({ type: String, select: false, default: null })
  refreshTokenHash?: string | null;

  @Prop({ type: Date, select: false, default: null })
  refreshTokenExpiresAt?: Date | null;

  @Prop({ type: String, select: false, default: null })
  emailVerificationTokenHash?: string | null;

  @Prop({ type: Date, select: false, default: null })
  emailVerificationTokenExpiresAt?: Date | null;

  @Prop({ type: String, select: false, default: null })
  passwordResetTokenHash?: string | null;

  @Prop({ type: Date, select: false, default: null })
  passwordResetTokenExpiresAt?: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ referralCode: 1 }, { unique: true });

