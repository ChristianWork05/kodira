'use client';

import { useQuery } from '@tanstack/react-query';
import type { HealthResponse } from '@kodira/types';
import { getKodiraApiClient } from '../kodiraClient';

export function useHealthQuery() {
  return useQuery<HealthResponse>({
    queryKey: ['health'],
    queryFn: async () => {
      const api = getKodiraApiClient();
      return api.health.getHealth();
    },
  });
}
