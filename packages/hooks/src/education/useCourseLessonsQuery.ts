'use client';

import { useQuery } from '@tanstack/react-query';
import type { GetCourseLessonsResponse } from '@kodira/types';
import { getKodiraApiClient } from '../kodiraClient';
import { courseLessonsKey } from './queryKeys';

export function useCourseLessonsQuery(courseId: string) {
  return useQuery<GetCourseLessonsResponse>({
    enabled: Boolean(courseId),
    queryKey: courseLessonsKey(courseId),
    queryFn: async () => {
      const api = getKodiraApiClient();
      return api.education.getCourseLessons(courseId);
    },
  });
}

