import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
  Inject,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as crypto from 'node:crypto';
import type {
  AuthResponse,
  AuthTokens,
  ForgotPasswordResponse,
  LoginRequest,
  RegisterRequest,
  ResetPasswordResponse,
  VerifyEmailResponse,
} from '@kodira/types';
import { UsersService } from '../users/users.service';
import { toUserMe } from '../users/users.mappers';
import type { UserDocument } from '../users/schemas/user.schema';
import { EMAIL_QUEUE, type EmailQueue } from './emails/emails.constants';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @Optional() @Inject(EMAIL_QUEUE) private readonly emailQueue?: EmailQueue,
  ) {}

  async register(dto: RegisterRequest): Promise<AuthResponse> {
    const email = dto.email.toLowerCase();
    const username = dto.username.toLowerCase();

    const referredByUserId = await this.resolveReferral(dto.referralCode);

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    const referralCode = await this.generateUniqueReferralCode();
    const user = await this.usersService.create({
      email,
      username,
      passwordHash,
      fullName: dto.fullName ?? null,
      referralCode,
      referredBy: referredByUserId,
    });

    user.lastLoginAt = new Date();
    await user.save();

    const tokens = await this.issueTokensAndPersistRefresh(user);

    await this.enqueueVerifyEmail(user);

    return {
      tokens,
      user: toUserMe(user),
    };
  }

  async login(dto: LoginRequest): Promise<AuthResponse> {
    const email = dto.email.toLowerCase();
    const user = await this.usersService.findByEmailWithPassword(email);

    if (!user || !user.isActive) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Invalid credentials',
      });
    }

    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Invalid credentials',
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const tokens = await this.issueTokensAndPersistRefresh(user);
    return { tokens, user: toUserMe(user) };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const { refreshSecret } = this.getJwtSecrets();

    let payload: any;
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Invalid refresh token',
      });
    }

    const userId = payload?.sub as string | undefined;
    if (!userId) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Invalid refresh token',
      });
    }
    if (payload?.type !== 'refresh') {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Invalid refresh token',
      });
    }

    const user = await this.usersService.findByIdWithRefresh(userId);
    if (!user || !user.isActive || !user.refreshTokenHash) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Invalid refresh token',
      });
    }

    if (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt <= new Date()) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Refresh token expired',
      });
    }

    const ok = await argon2.verify(user.refreshTokenHash, refreshToken);
    if (!ok) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Invalid refresh token',
      });
    }

    return this.issueTokensAndPersistRefresh(user);
  }

  async logout(userId: string): Promise<{ ok: true }> {
    await this.usersService.setRefreshTokenHash(userId, null, null);
    return { ok: true };
  }

  async forgotPassword(emailRaw: string): Promise<ForgotPasswordResponse> {
    const email = emailRaw.toLowerCase();
    const user = await this.usersService.findByEmail(email);

    if (!user) return { ok: true };

    const { token, tokenHash } = this.generateOpaqueToken();
    const ttlMinutes =
      this.config.get<number>('AUTH_PASSWORD_RESET_TOKEN_TTL_MINUTES') ?? 60;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);

    await this.usersService.setPasswordResetToken(
      user._id.toString(),
      tokenHash,
      expiresAt,
    );

    await this.enqueueResetPasswordEmail(user, token);
    return { ok: true };
  }

  async resetPassword(dto: {
    token: string;
    newPassword: string;
  }): Promise<ResetPasswordResponse> {
    const now = new Date();
    const tokenHash = this.hashToken(dto.token);
    const user = await this.usersService.findByPasswordResetTokenHash(
      tokenHash,
      now,
    );

    if (!user || !user.isActive) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Invalid or expired token',
      });
    }

    const passwordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
    });

    await this.usersService.setPasswordHash(user._id.toString(), passwordHash);
    await this.usersService.setPasswordResetToken(
      user._id.toString(),
      null,
      null,
    );
    await this.usersService.setRefreshTokenHash(user._id.toString(), null, null);

    return { ok: true };
  }

  async verifyEmail(token: string): Promise<VerifyEmailResponse> {
    const now = new Date();
    const tokenHash = this.hashToken(token);
    const user = await this.usersService.findByEmailVerificationTokenHash(
      tokenHash,
      now,
    );

    if (!user || !user.isActive) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Invalid or expired token',
      });
    }

    user.emailVerified = true;
    await user.save();
    await this.usersService.setEmailVerificationToken(
      user._id.toString(),
      null,
      null,
    );

    return { ok: true };
  }

  private async issueTokensAndPersistRefresh(
    user: UserDocument,
  ): Promise<AuthTokens> {
    const { accessSecret, refreshSecret } = this.getJwtSecrets();
    const accessTtlSeconds =
      this.config.get<number>('JWT_ACCESS_TOKEN_EXPIRES_IN_SECONDS') ?? 15 * 60;
    const refreshTtlDays =
      this.config.get<number>('JWT_REFRESH_TOKEN_EXPIRES_IN_DAYS') ?? 30;
    const refreshExpiresAt = new Date(
      Date.now() + refreshTtlDays * 24 * 60 * 60_000,
    );

    const accessToken = await this.jwt.signAsync(
      { sub: user._id.toString(), roles: user.roles },
      { secret: accessSecret, expiresIn: `${accessTtlSeconds}s` },
    );

    const refreshToken = await this.jwt.signAsync(
      { sub: user._id.toString(), type: 'refresh' },
      { secret: refreshSecret, expiresIn: `${refreshTtlDays}d` },
    );

    const refreshTokenHash = await argon2.hash(refreshToken, {
      type: argon2.argon2id,
    });
    await this.usersService.setRefreshTokenHash(
      user._id.toString(),
      refreshTokenHash,
      refreshExpiresAt,
    );

    return {
      tokenType: 'Bearer',
      accessToken,
      refreshToken,
      accessTokenExpiresInSeconds: accessTtlSeconds,
    };
  }

  private getJwtSecrets(): { accessSecret: string; refreshSecret: string } {
    const accessSecret = this.config.get<string>('JWT_SECRET');
    if (!accessSecret) throw new Error('JWT_SECRET is required');
    const refreshSecret =
      this.config.get<string>('JWT_REFRESH_SECRET') ?? accessSecret;
    return { accessSecret, refreshSecret };
  }

  private async resolveReferral(
    referralCode?: string | null,
  ): Promise<string | null> {
    if (!referralCode) return null;
    const referredBy = await this.usersService.findByReferralCode(referralCode);
    if (!referredBy) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Invalid referralCode',
      });
    }
    return referredBy._id.toString();
  }

  private async generateUniqueReferralCode(): Promise<string> {
    for (let i = 0; i < 8; i++) {
      const code = crypto
        .randomBytes(6)
        .toString('base64url')
        .replace(/[-_]/g, '')
        .slice(0, 8)
        .toUpperCase();
      const exists = await this.usersService.findByReferralCode(code);
      if (!exists) return code;
    }
    return crypto.randomUUID().slice(0, 8).toUpperCase();
  }

  private generateOpaqueToken(): { token: string; tokenHash: string } {
    const token = crypto.randomBytes(32).toString('base64url');
    return { token, tokenHash: this.hashToken(token) };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async enqueueVerifyEmail(user: UserDocument): Promise<void> {
    const { token, tokenHash } = this.generateOpaqueToken();
    const ttlMinutes =
      this.config.get<number>('AUTH_EMAIL_VERIFY_TOKEN_TTL_MINUTES') ?? 60 * 24;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);

    await this.usersService.setEmailVerificationToken(
      user._id.toString(),
      tokenHash,
      expiresAt,
    );

    if (!this.emailQueue) return;
    try {
      await this.emailQueue.add(
        'sendVerifyEmail',
        { to: user.email, token },
        { attempts: 3, removeOnComplete: true },
      );
    } catch (err) {
      this.logger.warn(
        `Email queue add failed (verify): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  private async enqueueResetPasswordEmail(
    user: UserDocument,
    token: string,
  ): Promise<void> {
    if (!this.emailQueue) return;
    try {
      await this.emailQueue.add(
        'sendResetPassword',
        { to: user.email, token },
        { attempts: 3, removeOnComplete: true },
      );
    } catch (err) {
      this.logger.warn(
        `Email queue add failed (reset): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }
}

