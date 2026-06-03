'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { LessonCompleteResponse } from '@kodira/types';
import { getKodiraApiClient } from '../kodiraClient';
import { myCoursesKey } from '../education/queryKeys';

export function useLessonCompleteMutation() {
  const queryClient = useQueryClient();

  return useMutation<LessonCompleteResponse, unknown, { lessonId: string }>({
    mutationFn: async ({ lessonId }) => {
      const api = getKodiraApiClient();
      return api.lessons.complete(lessonId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: myCoursesKey({}) });
    },
  });
}

