import { createKodiraApiClient, type KodiraApiClient } from '@kodira/api-client';

let browserClient: KodiraApiClient | undefined;

export function getKodiraApiClient() {
  const baseURL = process.env.NEXT_PUBLIC_API_URL ?? '';

  if (typeof window === 'undefined') return createKodiraApiClient({ baseURL });
  browserClient ??= createKodiraApiClient({ baseURL });
  return browserClient;
}
