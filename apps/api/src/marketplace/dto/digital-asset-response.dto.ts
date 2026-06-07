import { ApiProperty } from '@nestjs/swagger';
import type { CreateDigitalAssetResponse } from '@kodira/types';
import { DigitalAssetDto } from './digital-asset.dto';

export class DigitalAssetResponseDto implements CreateDigitalAssetResponse {
  @ApiProperty({ type: DigitalAssetDto })
  asset!: DigitalAssetDto;
}

