import { ApiProperty } from '@nestjs/swagger';
import type { CreateOfferingUploadUrlResponse } from '@kodira/types';

export class CreateUploadUrlResponseDto implements CreateOfferingUploadUrlResponse {
  @ApiProperty()
  uploadUrl!: string;

  @ApiProperty()
  fileKey!: string;
}

