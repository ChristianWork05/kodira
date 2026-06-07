import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min, MinLength } from 'class-validator';
import type { CreateDigitalAssetRequest } from '@kodira/types';

export class CreateDigitalAssetDto implements CreateDigitalAssetRequest {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  fileKey!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  fileName!: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  sizeBytes!: number;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  licenseTerms!: string;
}

