'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateLessonRequest, UpdateLessonResponse } from '@kodira/types';
import { getKodiraApiClient } from '../kodiraClient';
import { courseBySlugKey } from './queryKeys';
import { courseLessonsKey } from './queryKeys';

export function useUpdateLessonMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateLessonResponse,
    unknown,
    { courseId: string; sectionId: string; lessonId: string; data: UpdateLessonRequest; courseSlug?: string }
  >({
    mutationFn: async ({ courseId, sectionId, lessonId, data }) => {
      const api = getKodiraApiClient();
      return api.education.updateLesson(courseId, sectionId, lessonId, data);
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: courseLessonsKey(variables.courseId) }),
        variables.courseSlug
          ? queryClient.invalidateQueries({ queryKey: courseBySlugKey(variables.courseSlug) })
          : Promise.resolve(),
      ]);
    },
  });
}

