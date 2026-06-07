'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DeleteSectionResponse } from '@kodira/types';
import { getKodiraApiClient } from '../kodiraClient';

export function useDeleteSectionMutation() {
  const queryClient = useQueryClient();

  return useMutation<DeleteSectionResponse, unknown, { courseId: string; sectionId: string }>({
    mutationFn: async ({ courseId, sectionId }) => {
      const api = getKodiraApiClient();
      return api.education.deleteSection(courseId, sectionId);
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

