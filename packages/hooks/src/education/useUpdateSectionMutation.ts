'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Course, UpdateSectionRequest } from '@kodira/types';
import { getKodiraApiClient } from '../kodiraClient';

export function useUpdateSectionMutation() {
  const queryClient = useQueryClient();

  return useMutation<Course, unknown, { courseId: string; sectionId: string; data: UpdateSectionRequest }>({
    mutationFn: async ({ courseId, sectionId, data }) => {
      const api = getKodiraApiClient();
      return api.education.updateSection(courseId, sectionId, data);
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

