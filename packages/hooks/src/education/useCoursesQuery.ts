'use client';

import { useQuery } from '@tanstack/react-query';
import type { ListCoursesQuery, ListCoursesResponse } from '@kodira/types';
import { getKodiraApiClient } from '../kodiraClient';
import { coursesKey } from './queryKeys';

export function useCoursesQuery(query: ListCoursesQuery) {
  return useQuery<ListCoursesResponse>({
    queryKey: coursesKey(query),
    queryFn: async () => {
      const api = getKodiraApiClient();
      return api.education.listCourses(query);
    },
  });
}
