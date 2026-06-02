'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { EnrollCourseResponse } from '@kodira/types';
import { getKodiraApiClient } from '../kodiraClient';
import { myCoursesKey } from './queryKeys';

export function useEnrollCourseMutation() {
  const queryClient = useQueryClient();

  return useMutation<EnrollCourseResponse, unknown, { courseId: string }>({
    mutationFn: async ({ courseId }) => {
      const api = getKodiraApiClient();
      return api.education.enrollCourse(courseId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: myCoursesKey({}) });
    },
  });
}
