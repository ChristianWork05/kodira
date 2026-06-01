import type { UserMe } from './users';

export interface AuthTokens {
  tokenType: 'Bearer';
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresInSeconds: number;
}

export interface AuthResponse {
  tokens: AuthTokens;
  user: UserMe;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  fullName?: string | null;
  referralCode?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LogoutResponse {
  ok: true;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  ok: true;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  ok: true;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyEmailResponse {
  ok: true;
}

