'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Course } from '@kodira/types';
import { getKodiraApiClient } from '../kodiraClient';

export function usePublishCourseMutation() {
  const queryClient = useQueryClient();

  return useMutation<Course, unknown, { courseId: string }>({
    mutationFn: async ({ courseId }) => {
      const api = getKodiraApiClient();
      return api.education.publishCourse(courseId);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['education', 'instructorCourses'] }),
        queryClient.invalidateQueries({ queryKey: ['education', 'courses'] }),
        queryClient.invalidateQueries({ queryKey: ['education', 'course'] }),
      ]);
    },
  });
}

