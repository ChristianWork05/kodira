import { ApiProperty } from '@nestjs/swagger';
import type { CourseListItem, ListCoursesResponse } from '@kodira/types';
import { CourseDto, CourseMetricsDto, CourseInstructorDto } from './course.dto';
import { CategoryDto } from './category.dto';

export class CourseListItemDto implements CourseListItem {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ nullable: true })
  shortDescription?: string | null;

  @ApiProperty({ type: CourseInstructorDto })
  instructor!: Pick<CourseInstructorDto, 'id' | 'username' | 'fullName' | 'avatarUrl'>;

  @ApiProperty({ type: CategoryDto, nullable: true })
  category!: Pick<CategoryDto, 'id' | 'name' | 'slug' | 'icon'> | null;

  @ApiProperty()
  level!: CourseDto['level'];

  @ApiProperty()
  language!: string;

  @ApiProperty({ example: 0 })
  price!: number;

  @ApiProperty({ nullable: true })
  discountPrice?: number | null;

  @ApiProperty({ example: false })
  isFree!: boolean;

  @ApiProperty({ nullable: true })
  thumbnailUrl?: string | null;

  @ApiProperty({ example: 'published' })
  state!: 'published';

  @ApiProperty({ nullable: true })
  publishedAt?: string | null;

  @ApiProperty({ type: CourseMetricsDto })
  metrics!: Pick<
    CourseMetricsDto,
    'durationHours' | 'lessonCount' | 'enrollmentCount' | 'rating' | 'reviewCount'
  >;
}

export class ListCoursesResponseDto implements ListCoursesResponse {
  @ApiProperty({ type: [CourseListItemDto] })
  items!: CourseListItemDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 0 })
  total!: number;

  @ApiProperty({ example: 1 })
  totalPages!: number;
}

