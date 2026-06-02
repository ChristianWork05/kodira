import { ApiProperty } from '@nestjs/swagger';
import type { ListMyCoursesResponse, MyCourseEnrollment, MyCourseItem } from '@kodira/types';
import { CourseListItemDto } from './list-courses-response.dto';

class EnrollmentSummaryDto implements MyCourseEnrollment {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  enrolledAt!: string;

  @ApiProperty({ nullable: true })
  lastActivity!: string | null;

  @ApiProperty({ example: 0 })
  progressPercentage!: number;

  @ApiProperty({ example: false })
  isCompleted!: boolean;

  @ApiProperty({ nullable: true })
  completedAt!: string | null;
}

export class MyCourseItemDto implements MyCourseItem {
  @ApiProperty({ type: CourseListItemDto })
  course!: CourseListItemDto;

  @ApiProperty({ type: EnrollmentSummaryDto })
  enrollment!: EnrollmentSummaryDto;

  @ApiProperty({ nullable: true })
  lastLessonId!: string | null;
}

export class ListMyCoursesResponseDto implements ListMyCoursesResponse {
  @ApiProperty({ type: [MyCourseItemDto] })
  items!: MyCourseItemDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 0 })
  total!: number;

  @ApiProperty({ example: 1 })
  totalPages!: number;
}

