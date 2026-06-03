'use client';

import { useMutation } from '@tanstack/react-query';
import type { LessonProgressRequest, LessonProgressResponse } from '@kodira/types';
import { getKodiraApiClient } from '../kodiraClient';

export function useLessonProgressMutation() {
  return useMutation<LessonProgressResponse, unknown, { lessonId: string; data: LessonProgressRequest }>({
    mutationFn: async ({ lessonId, data }) => {
      const api = getKodiraApiClient();
      return api.lessons.saveProgress(lessonId, data);
    },
  });
}

