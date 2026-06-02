'use client';

import { useQuery } from '@tanstack/react-query';
import type { Category } from '@kodira/types';
import { getKodiraApiClient } from '../kodiraClient';
import { courseCategoriesKey } from './queryKeys';

export function useCourseCategoriesQuery() {
  return useQuery<Category[]>({
    queryKey: courseCategoriesKey(),
    queryFn: async () => {
      const api = getKodiraApiClient();
      return api.education.listCategories();
    },
  });
}
