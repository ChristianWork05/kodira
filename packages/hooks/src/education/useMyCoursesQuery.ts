'use client';

import { useQuery } from '@tanstack/react-query';
import type { ListMyCoursesQuery, ListMyCoursesResponse } from '@kodira/types';
import { getKodiraApiClient } from '../kodiraClient';
import { myCoursesKey } from './queryKeys';

export function useMyCoursesQuery(query: ListMyCoursesQuery) {
  return useQuery<ListMyCoursesResponse>({
    queryKey: myCoursesKey(query),
    queryFn: async () => {
      const api = getKodiraApiClient();
      return api.education.listMyCourses(query);
    },
  });
}
