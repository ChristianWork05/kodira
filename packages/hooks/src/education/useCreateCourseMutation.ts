'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Course, CreateCourseRequest } from '@kodira/types';
import { getKodiraApiClient } from '../kodiraClient';

export function useCreateCourseMutation() {
  const queryClient = useQueryClient();

  return useMutation<Course, unknown, CreateCourseRequest>({
    mutationFn: async (body) => {
      const api = getKodiraApiClient();
      return api.education.createCourse(body);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['education', 'instructorCourses'] }),
        queryClient.invalidateQueries({ queryKey: ['education', 'courses'] }),
      ]);
    },
  });
}

