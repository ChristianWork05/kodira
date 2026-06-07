'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AddLessonRequest, Course } from '@kodira/types';
import { getKodiraApiClient } from '../kodiraClient';

export function useAddLessonMutation() {
  const queryClient = useQueryClient();

  return useMutation<Course, unknown, { courseId: string; sectionId: string; data: AddLessonRequest }>({
    mutationFn: async ({ courseId, sectionId, data }) => {
      const api = getKodiraApiClient();
      return api.education.addLesson(courseId, sectionId, data);
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

