import { ApiProperty } from '@nestjs/swagger';
import type { GetCourseLessonsResponse } from '@kodira/types';
import { SectionDto } from './course.dto';

export class GetCourseLessonsResponseDto implements GetCourseLessonsResponse {
  @ApiProperty()
  courseId!: string;

  @ApiProperty({ type: [SectionDto] })
  sections!: SectionDto[];
}

