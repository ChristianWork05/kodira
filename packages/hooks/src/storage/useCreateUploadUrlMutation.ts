'use client';

import { useMutation } from '@tanstack/react-query';
import type { StorageCreateUploadUrlRequest, StorageCreateUploadUrlResponse } from '@kodira/types';
import { getKodiraApiClient } from '../kodiraClient';

export function useCreateUploadUrlMutation() {
  return useMutation<StorageCreateUploadUrlResponse, unknown, StorageCreateUploadUrlRequest>({
    mutationFn: async (body) => {
      const api = getKodiraApiClient();
      return api.storage.createUploadUrl(body);
    },
  });
}

