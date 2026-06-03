import { ApiProperty } from '@nestjs/swagger';
import type {
  CourseState,
  InstructorCourseItem,
  InstructorCourseLessonItem,
  InstructorCourseSectionItem,
  ListInstructorCoursesResponse,
  LessonType,
} from '@kodira/types';
import { COURSE_STATES, LESSON_TYPES } from '@kodira/types';

export class InstructorCourseLessonItemDto implements InstructorCourseLessonItem {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ example: 0 })
  order!: number;

  @ApiProperty({ enum: LESSON_TYPES })
  type!: LessonType;

  @ApiProperty({ example: false })
  isFreePreview!: boolean;
}

export class InstructorCourseSectionItemDto implements InstructorCourseSectionItem {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ example: 0 })
  order!: number;

  @ApiProperty({ type: [InstructorCourseLessonItemDto] })
  lessons!: InstructorCourseLessonItemDto[];
}

export class InstructorCourseItemDto implements InstructorCourseItem {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ enum: COURSE_STATES })
  state!: CourseState;

  @ApiProperty({ type: [InstructorCourseSectionItemDto] })
  sections!: InstructorCourseSectionItemDto[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class ListInstructorCoursesResponseDto implements ListInstructorCoursesResponse {
  @ApiProperty({ type: [InstructorCourseItemDto] })
  items!: InstructorCourseItemDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 0 })
  total!: number;

  @ApiProperty({ example: 1 })
  totalPages!: number;
}
