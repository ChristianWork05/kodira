'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DeleteLessonResponse } from '@kodira/types';
import { getKodiraApiClient } from '../kodiraClient';

export function useDeleteLessonMutation() {
  const queryClient = useQueryClient();

  return useMutation<DeleteLessonResponse, unknown, { courseId: string; sectionId: string; lessonId: string }>({
    mutationFn: async ({ courseId, sectionId, lessonId }) => {
      const api = getKodiraApiClient();
      return api.education.deleteLesson(courseId, sectionId, lessonId);
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

