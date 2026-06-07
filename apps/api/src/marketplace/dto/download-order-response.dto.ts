import { ApiProperty } from '@nestjs/swagger';
import type { DownloadOrderResponse } from '@kodira/types';

export class DownloadOrderResponseDto implements DownloadOrderResponse {
  @ApiProperty()
  downloadUrl!: string;

  @ApiProperty({ example: 600 })
  expiresInSeconds!: number;
}
