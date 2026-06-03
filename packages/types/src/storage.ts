export const STORAGE_UPLOAD_KINDS = ['video', 'image', 'attachment'] as const;
export type StorageUploadKind = (typeof STORAGE_UPLOAD_KINDS)[number];

export interface StorageCreateUploadUrlRequest {
  kind: StorageUploadKind;
  filename: string;
  contentType: string;
  sizeBytes: number;
  courseId: string;
  lessonId?: string;
}

export interface StorageCreateUploadUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

