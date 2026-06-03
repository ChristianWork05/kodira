import { createKodiraApiClient, type KodiraApiClient } from '@kodira/api-client';
import type { AuthTokens } from '@kodira/types';

let browserClient: KodiraApiClient | undefined;

const AUTH_STORAGE_KEY = 'kodira.auth.tokens.v1';
const PROTECTED_PREFIXES = ['/dashboard', '/courses', '/studio', '/profile', '/settings', '/design'] as const;

function shouldRedirectToLogin(pathname: string) {
  if (pathname === '/login' || pathname === '/register') return false;
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'));
}

function readStoredTokens(): AuthTokens | undefined {
  if (typeof window === 'undefined') return undefined;
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as AuthTokens;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof parsed.accessToken !== 'string' ||
      typeof parsed.refreshToken !== 'string'
    ) {
      return undefined;
    }
    return parsed;
  } catch {
    return undefined;
  }
}

function writeStoredTokens(tokens: AuthTokens) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens));
}

function clearStoredTokens() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getKodiraApiClient() {
  const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

  if (typeof window === 'undefined') return createKodiraApiClient({ baseURL });
  browserClient ??= createKodiraApiClient({
    baseURL,
    tokenStorage: {
      getAccessToken: async () => readStoredTokens()?.accessToken,
      getRefreshToken: async () => readStoredTokens()?.refreshToken,
      setTokens: async (tokens) => writeStoredTokens(tokens),
      clear: async () => clearStoredTokens(),
    },
    onAuthInvalidated: () => {
      const pathname = window.location.pathname;
      if (!shouldRedirectToLogin(pathname)) return;
      const next = `${window.location.pathname}${window.location.search}`;
      const target = next ? `/login?next=${encodeURIComponent(next)}` : '/login';
      if (window.location.pathname !== '/login') window.location.assign(target);
    },
  });
  return browserClient;
}
