import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import type { AddLessonRequest, LessonType, UpdateLessonRequest } from '@kodira/types';
import { LESSON_TYPES } from '@kodira/types';

class LessonQuizQuestionDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @IsString()
  prompt!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  options!: string[];

  @ApiProperty()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  correctOptionIndex!: number;
}

class LessonQuizDto {
  @ApiProperty({ type: [LessonQuizQuestionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  questions!: LessonQuizQuestionDto[];
}

class LessonCodeExerciseDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  prompt?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  starterCode?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  solutionCode?: string | null;
}

export class AddLessonDto implements AddLessonRequest {
  @ApiProperty()
  @IsString()
  @MaxLength(140)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(0)
  order?: number;

  @ApiProperty({ enum: LESSON_TYPES })
  @IsEnum(LESSON_TYPES)
  type!: LessonType;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  videoId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === null ? null : Number(value)))
  @IsNumber()
  @Min(0)
  videoDuration?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  content?: string | null;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isFreePreview?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === null ? null : Number(value)))
  @IsInt()
  @Min(0)
  dripDays?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateNested()
  quiz?: LessonQuizDto | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateNested()
  codeExercise?: LessonCodeExerciseDto | null;

  @ApiPropertyOptional({ type: [String], default: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  resourceUrls?: string[];

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  transcript?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  subtitleUrl?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  aiSummary?: string | null;
}

export class UpdateLessonDto implements UpdateLessonRequest {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(140)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ enum: LESSON_TYPES })
  @IsOptional()
  @IsEnum(LESSON_TYPES)
  type?: LessonType;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  videoId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === null ? null : Number(value)))
  @IsNumber()
  @Min(0)
  videoDuration?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  content?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isFreePreview?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === null ? null : Number(value)))
  @IsInt()
  @Min(0)
  dripDays?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateNested()
  quiz?: LessonQuizDto | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateNested()
  codeExercise?: LessonCodeExerciseDto | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  resourceUrls?: string[];

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  transcript?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  subtitleUrl?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  aiSummary?: string | null;
}

