import { ApiProperty } from '@nestjs/swagger';
import type { DigitalAsset } from '@kodira/types';

export class DigitalAssetDto implements DigitalAsset {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  offeringId!: string;

  @ApiProperty()
  fileKey!: string;

  @ApiProperty()
  fileName!: string;

  @ApiProperty()
  sizeBytes!: number;

  @ApiProperty({ default: 1 })
  version!: number;

  @ApiProperty()
  licenseTerms!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

