import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
import type { CourseLevel, CreateCourseRequest } from '@kodira/types';
import { COURSE_LEVELS } from '@kodira/types';

export class CreateCourseDto implements CreateCourseRequest {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  title!: string;

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

  @ApiProperty({ enum: COURSE_LEVELS })
  @IsEnum(COURSE_LEVELS)
  level!: CourseLevel;

  @ApiProperty({ example: 'es' })
  @IsString()
  @MaxLength(10)
  language!: string;

  @ApiProperty({ example: 0 })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === null ? null : Number(value)))
  @IsNumber()
  @Min(0)
  discountPrice?: number | null;

  @ApiProperty({ example: true })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isFree!: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : typeof value === 'string' ? value.trim() : value))
  @IsUrl({ require_protocol: true, require_tld: false })
  thumbnailUrl?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  promoVideoUrl?: string | null;

  @ApiPropertyOptional({ type: [String], default: [] })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ type: [String], default: [] })
  @IsOptional()
  requirements?: string[];

  @ApiPropertyOptional({ type: [String], default: [] })
  @IsOptional()
  objectives?: string[];

  @ApiPropertyOptional({ type: [String], default: [] })
  @IsOptional()
  targetAudience?: string[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  dripEnabled?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  aiDescription?: string | null;
}

