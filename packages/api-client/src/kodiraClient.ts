import axios, { type AxiosInstance } from 'axios';
import type {
  AuthResponse,
  AuthTokens,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  HealthResponse,
  LoginRequest,
  LogoutResponse,
  RefreshRequest,
  RegisterRequest,
  UpdateMyProfileRequest,
  UserMe,
  PublicUserProfile,
} from '@kodira/types';
import { createHttpClient, type CreateHttpClientOptions } from './http';

export interface AuthTokenStorage {
  getAccessToken: () => string | undefined | Promise<string | undefined>;
  getRefreshToken: () => string | undefined | Promise<string | undefined>;
  setTokens: (tokens: AuthTokens) => void | Promise<void>;
  clear: () => void | Promise<void>;
}

export interface CreateKodiraApiClientOptions extends CreateHttpClientOptions {
  tokenStorage?: AuthTokenStorage;
  onAuthInvalidated?: () => void;
}

export interface KodiraApiClient {
  http: AxiosInstance;
  health: {
    getHealth: () => Promise<HealthResponse>;
  };
  auth: {
    register: (body: RegisterRequest) => Promise<AuthResponse>;
    login: (body: LoginRequest) => Promise<AuthResponse>;
    refresh: (body: RefreshRequest) => Promise<AuthTokens>;
    logout: () => Promise<LogoutResponse>;
    forgotPassword: (body: ForgotPasswordRequest) => Promise<ForgotPasswordResponse>;
    clearSession: () => Promise<void>;
  };
  users: {
    getMe: () => Promise<UserMe>;
    updateMe: (body: UpdateMyProfileRequest) => Promise<UserMe>;
    getPublicProfile: (username: string) => Promise<PublicUserProfile>;
  };
}

export function createKodiraApiClient(
  options: CreateKodiraApiClientOptions = {},
): KodiraApiClient {
  const refreshHttp = axios.create({
    baseURL: options.baseURL,
    headers: { 'Content-Type': 'application/json' },
  });

  const tokenStorage = options.tokenStorage;
  const getAccessToken =
    options.getAccessToken ??
    (tokenStorage ? () => tokenStorage.getAccessToken() : undefined);

  const onRefreshError = async (err: unknown) => {
    options.onRefreshError?.(err);
    if (tokenStorage) await tokenStorage.clear();
    options.onAuthInvalidated?.();
  };

  const refreshAccessToken =
    options.refreshAccessToken ??
    (tokenStorage
      ? async () => {
          const refreshToken = await tokenStorage.getRefreshToken();
          if (!refreshToken) return undefined;
          try {
            const { data } = await refreshHttp.post<AuthTokens>(
              '/api/v1/auth/refresh',
              { refreshToken } satisfies RefreshRequest,
            );
            await tokenStorage.setTokens(data);
            return data.accessToken;
          } catch (err) {
            await onRefreshError(err);
            return undefined;
          }
        }
      : undefined);

  const http = createHttpClient({
    ...options,
    getAccessToken,
    refreshAccessToken,
    onRefreshError,
  });

  return {
    http,
    health: {
      async getHealth() {
        const { data } = await http.get<HealthResponse>('/api/v1/health');
        return data;
      },
    },
    auth: {
      async register(body) {
        const { data } = await http.post<AuthResponse>('/api/v1/auth/register', body);
        if (tokenStorage) await tokenStorage.setTokens(data.tokens);
        return data;
      },
      async login(body) {
        const { data } = await http.post<AuthResponse>('/api/v1/auth/login', body);
        if (tokenStorage) await tokenStorage.setTokens(data.tokens);
        return data;
      },
      async refresh(body) {
        const { data } = await refreshHttp.post<AuthTokens>('/api/v1/auth/refresh', body);
        if (tokenStorage) await tokenStorage.setTokens(data);
        return data;
      },
      async logout() {
        const { data } = await http.post<LogoutResponse>('/api/v1/auth/logout');
        if (tokenStorage) await tokenStorage.clear();
        return data;
      },
      async forgotPassword(body) {
        const { data } = await http.post<ForgotPasswordResponse>(
          '/api/v1/auth/forgot-password',
          body,
        );
        return data;
      },
      async clearSession() {
        if (tokenStorage) await tokenStorage.clear();
      },
    },
    users: {
      async getMe() {
        const { data } = await http.get<UserMe>('/api/v1/users/me');
        return data;
      },
      async updateMe(body) {
        const { data } = await http.put<UserMe>('/api/v1/users/me', body);
        return data;
      },
      async getPublicProfile(username) {
        const { data } = await http.get<PublicUserProfile>(`/api/v1/users/${username}`);
        return data;
      },
    },
  };
}
