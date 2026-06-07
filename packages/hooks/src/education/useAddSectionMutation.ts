'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AddSectionRequest, Course } from '@kodira/types';
import { getKodiraApiClient } from '../kodiraClient';

export function useAddSectionMutation() {
  const queryClient = useQueryClient();

  return useMutation<Course, unknown, { courseId: string; data: AddSectionRequest }>({
    mutationFn: async ({ courseId, data }) => {
      const api = getKodiraApiClient();
      return api.education.addSection(courseId, data);
    },
    onSuccess: async (_data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['education', 'instructorCourses'] }),
        queryClient.invalidateQueries({ queryKey: ['education', 'courses'] }),
        queryClient.invalidateQueries({ queryKey: ['education', 'course'] }),
      ]);
    },
  });
}

