import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import type { CourseState, ListInstructorCoursesQuery } from '@kodira/types';
import { COURSE_STATES } from '@kodira/types';

export class ListInstructorCoursesQueryDto implements ListInstructorCoursesQuery {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, maximum: 50 })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({ enum: COURSE_STATES })
  @IsOptional()
  @IsEnum(COURSE_STATES)
  state?: CourseState;
}

