import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min, MinLength } from 'class-validator';
import type { CreateOfferingUploadUrlRequest } from '@kodira/types';

export class CreateOfferingUploadUrlDto implements CreateOfferingUploadUrlRequest {
  @ApiProperty({ example: 'assets.zip' })
  @IsString()
  @MinLength(1)
  filename!: string;

  @ApiProperty({ example: 'application/zip' })
  @IsString()
  @MinLength(1)
  contentType!: string;

  @ApiProperty({ example: 1024 })
  @IsNumber()
  @Min(1)
  sizeBytes!: number;
}

