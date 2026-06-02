'use client';

import { useQuery } from '@tanstack/react-query';
import type { Course } from '@kodira/types';
import { getKodiraApiClient } from '../kodiraClient';
import { courseBySlugKey } from './queryKeys';

export function useCourseBySlugQuery(slug: string) {
  return useQuery<Course>({
    enabled: Boolean(slug),
    queryKey: courseBySlugKey(slug),
    queryFn: async () => {
      const api = getKodiraApiClient();
      return api.education.getCourseBySlug(slug);
    },
  });
}
