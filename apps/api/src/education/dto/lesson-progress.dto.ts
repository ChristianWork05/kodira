import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
import type { LessonProgressRequest } from '@kodira/types';

export class LessonProgressDto implements LessonProgressRequest {
  @ApiProperty({ example: 25, minimum: 0, maximum: 100 })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  @Max(100)
  watchPercentage!: number;

  @ApiProperty({ example: 90, minimum: 0 })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  lastPositionSeconds!: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === null ? null : Number(value)))
  @IsInt()
  @Min(0)
  quizScore?: number | null;
}

