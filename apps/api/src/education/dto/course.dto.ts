import { ApiProperty } from '@nestjs/swagger';
import type {
  Category,
  Course,
  CourseInstructor,
  CourseLevel,
  CourseMetrics,
  CourseState,
  Lesson,
  LessonCodeExercise,
  LessonQuiz,
  LessonType,
  Section,
  UserRole,
} from '@kodira/types';
import { COURSE_LEVELS, COURSE_STATES, LESSON_TYPES, USER_ROLES } from '@kodira/types';
import { CategoryDto } from './category.dto';

export class CourseInstructorDto implements CourseInstructor {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  username!: string;

  @ApiProperty({ nullable: true })
  fullName?: string | null;

  @ApiProperty({ nullable: true })
  avatarUrl?: string | null;

  @ApiProperty({ nullable: true })
  bio?: string | null;

  @ApiProperty({ isArray: true, enum: USER_ROLES, example: ['instructor'] })
  roles!: UserRole[];

  @ApiProperty({ example: 0 })
  xp!: number;

  @ApiProperty({ example: 0 })
  currentStreak!: number;

  @ApiProperty()
  createdAt!: string;
}

export class LessonQuizQuestionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  prompt!: string;

  @ApiProperty({ type: [String] })
  options!: string[];

  @ApiProperty()
  correctOptionIndex!: number;
}

export class LessonQuizDto implements LessonQuiz {
  @ApiProperty({ type: [LessonQuizQuestionDto] })
  questions!: LessonQuizQuestionDto[];
}

export class LessonCodeExerciseDto implements LessonCodeExercise {
  @ApiProperty({ nullable: true })
  prompt?: string | null;

  @ApiProperty({ nullable: true })
  starterCode?: string | null;

  @ApiProperty({ nullable: true })
  solutionCode?: string | null;
}

export class LessonDto implements Lesson {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ example: 0 })
  order!: number;

  @ApiProperty({ enum: LESSON_TYPES })
  type!: LessonType;

  @ApiProperty({ nullable: true })
  videoId?: string | null;

  @ApiProperty({ nullable: true, example: 120 })
  videoDuration?: number | null;

  @ApiProperty({ nullable: true })
  content?: string | null;

  @ApiProperty({ example: false })
  isFreePreview!: boolean;

  @ApiProperty({ nullable: true })
  dripDays?: number | null;

  @ApiProperty({ nullable: true, type: LessonQuizDto })
  quiz?: LessonQuizDto | null;

  @ApiProperty({ nullable: true, type: LessonCodeExerciseDto })
  codeExercise?: LessonCodeExerciseDto | null;

  @ApiProperty({ type: [String] })
  resourceUrls!: string[];

  @ApiProperty({ nullable: true })
  transcript?: string | null;

  @ApiProperty({ nullable: true })
  subtitleUrl?: string | null;

  @ApiProperty({ nullable: true })
  aiSummary?: string | null;
}

export class SectionDto implements Section {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ example: 0 })
  order!: number;

  @ApiProperty({ type: [LessonDto] })
  lessons!: LessonDto[];
}

export class CourseMetricsDto implements CourseMetrics {
  @ApiProperty({ example: 0 })
  durationHours!: number;

  @ApiProperty({ example: 0 })
  lessonCount!: number;

  @ApiProperty({ example: 0 })
  enrollmentCount!: number;

  @ApiProperty({ example: 0 })
  rating!: number;

  @ApiProperty({ example: 0 })
  reviewCount!: number;

  @ApiProperty({ example: 0 })
  completionRate!: number;
}

export class CourseDto implements Course {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ nullable: true })
  description?: string | null;

  @ApiProperty({ nullable: true })
  shortDescription?: string | null;

  @ApiProperty({ type: CourseInstructorDto })
  instructor!: CourseInstructorDto;

  @ApiProperty({ type: CategoryDto, nullable: true })
  category!: Category | null;

  @ApiProperty({ enum: COURSE_LEVELS })
  level!: CourseLevel;

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

  @ApiProperty({ nullable: true })
  promoVideoUrl?: string | null;

  @ApiProperty({ type: [String] })
  tags!: string[];

  @ApiProperty({ type: [String] })
  requirements!: string[];

  @ApiProperty({ type: [String] })
  objectives!: string[];

  @ApiProperty({ type: [String] })
  targetAudience!: string[];

  @ApiProperty({ enum: COURSE_STATES, default: 'draft' })
  state!: CourseState;

  @ApiProperty({ nullable: true })
  publishedAt?: string | null;

  @ApiProperty({ type: CourseMetricsDto })
  metrics!: CourseMetricsDto;

  @ApiProperty({ example: false })
  dripEnabled!: boolean;

  @ApiProperty({ nullable: true })
  aiDescription?: string | null;

  @ApiProperty({ type: [Number] })
  embedding!: number[];

  @ApiProperty({ type: [SectionDto] })
  sections!: SectionDto[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

