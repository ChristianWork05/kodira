'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Course, UpdateCourseRequest } from '@kodira/types';
import { getKodiraApiClient } from '../kodiraClient';

export function useUpdateCourseMutation() {
  const queryClient = useQueryClient();

  return useMutation<Course, unknown, { courseId: string; data: UpdateCourseRequest }>({
    mutationFn: async ({ courseId, data }) => {
      const api = getKodiraApiClient();
      return api.education.updateCourse(courseId, data);
    },
    onSuccess: async (_data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['education', 'instructorCourses'] }),
        queryClient.invalidateQueries({ queryKey: ['education', 'courses'] }),
        queryClient.invalidateQueries({ queryKey: ['education', 'courseLessons'] }),
        queryClient.invalidateQueries({ queryKey: ['education', 'course'] }),
      ]);
    },
  });
}

