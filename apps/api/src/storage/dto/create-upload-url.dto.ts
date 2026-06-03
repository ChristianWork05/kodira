import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import type { StorageCreateUploadUrlRequest, StorageUploadKind } from '@kodira/types';
import { STORAGE_UPLOAD_KINDS } from '@kodira/types';

export class StorageCreateUploadUrlDto implements StorageCreateUploadUrlRequest {
  @ApiProperty({ enum: STORAGE_UPLOAD_KINDS })
  @IsEnum(STORAGE_UPLOAD_KINDS)
  kind!: StorageUploadKind;

  @ApiProperty()
  @IsString()
  @MaxLength(240)
  filename!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  contentType!: string;

  @ApiProperty({ example: 1234 })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  sizeBytes!: number;

  @ApiProperty()
  @IsMongoId()
  courseId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  lessonId?: string;
}

