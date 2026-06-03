import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import type { CourseLevel, UpdateCourseRequest } from '@kodira/types';
import { COURSE_LEVELS } from '@kodira/types';

export class UpdateCourseDto implements UpdateCourseRequest {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  shortDescription?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((v) => v.categoryId !== null)
  @IsMongoId()
  categoryId?: string | null;

  @ApiPropertyOptional({ enum: COURSE_LEVELS })
  @IsOptional()
  @IsEnum(COURSE_LEVELS)
  level?: CourseLevel;

  @ApiPropertyOptional({ example: 'es' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === null ? null : Number(value)))
  @IsNumber()
  @Min(0)
  discountPrice?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isFree?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : typeof value === 'string' ? value.trim() : value))
  @IsUrl({ require_protocol: true, require_tld: false })
  thumbnailUrl?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  promoVideoUrl?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  requirements?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  objectives?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  targetAudience?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  dripEnabled?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  aiDescription?: string | null;

  @ApiPropertyOptional({ enum: ['draft', 'review', 'archived'] })
  @IsOptional()
  @IsEnum(['draft', 'review', 'archived'])
  state?: 'draft' | 'review' | 'archived';
}

