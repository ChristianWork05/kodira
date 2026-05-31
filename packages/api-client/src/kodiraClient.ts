import type { AxiosInstance } from 'axios';
import type { HealthResponse } from '@kodira/types';
import { createHttpClient, type CreateHttpClientOptions } from './http';

export interface KodiraApiClient {
  http: AxiosInstance;
  health: {
    getHealth: () => Promise<HealthResponse>;
  };
}

export function createKodiraApiClient(options: CreateHttpClientOptions = {}): KodiraApiClient {
  const http = createHttpClient(options);

  return {
    http,
    health: {
      async getHealth() {
        const { data } = await http.get<HealthResponse>('/api/v1/health');
        return data;
      },
    },
  };
}
