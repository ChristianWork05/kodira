import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import type { ListMyCoursesQuery } from '@kodira/types';

export class ListMyCoursesQueryDto implements ListMyCoursesQuery {
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
}

