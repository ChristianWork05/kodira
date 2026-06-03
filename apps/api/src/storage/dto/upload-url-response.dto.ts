import { ApiProperty } from '@nestjs/swagger';
import type { StorageCreateUploadUrlResponse } from '@kodira/types';

export class StorageCreateUploadUrlResponseDto implements StorageCreateUploadUrlResponse {
  @ApiProperty()
  uploadUrl!: string;

  @ApiProperty()
  publicUrl!: string;

  @ApiProperty()
  key!: string;
}

