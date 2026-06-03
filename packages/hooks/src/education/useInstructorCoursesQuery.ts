'use client';

import { useQuery } from '@tanstack/react-query';
import type { ListInstructorCoursesQuery, ListInstructorCoursesResponse } from '@kodira/types';
import { getKodiraApiClient } from '../kodiraClient';
import { instructorCoursesKey } from './queryKeys';

export function useInstructorCoursesQuery(
  query: ListInstructorCoursesQuery,
  options?: { enabled?: boolean },
) {
  return useQuery<ListInstructorCoursesResponse>({
    enabled: options?.enabled ?? true,
    queryKey: instructorCoursesKey(query),
    queryFn: async () => {
      const api = getKodiraApiClient();
      return api.education.listInstructorCourses(query);
    },
  });
}
