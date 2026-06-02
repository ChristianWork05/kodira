import type { UserRole } from './users';

export const COURSE_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type CourseLevel = (typeof COURSE_LEVELS)[number];

export const COURSE_STATES = ['draft', 'review', 'published', 'archived'] as const;
export type CourseState = (typeof COURSE_STATES)[number];

export const LESSON_TYPES = ['video', 'text', 'quiz', 'code', 'live', 'resource'] as const;
export type LessonType = (typeof LESSON_TYPES)[number];

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseInstructor {
  id: string;
  username: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  roles: UserRole[];
  xp: number;
  currentStreak: number;
  createdAt: string;
}

export interface LessonQuiz {
  questions: Array<{
    id: string;
    prompt: string;
    options: string[];
    correctOptionIndex: number;
  }>;
}

export interface LessonCodeExercise {
  prompt?: string | null;
  starterCode?: string | null;
  solutionCode?: string | null;
}

export interface Lesson {
  id: string;
  title: string;
  order: number;
  type: LessonType;
  videoId?: string | null;
  videoDuration?: number | null;
  content?: string | null;
  isFreePreview: boolean;
  dripDays?: number | null;
  quiz?: LessonQuiz | null;
  codeExercise?: LessonCodeExercise | null;
  resourceUrls: string[];
  transcript?: string | null;
  subtitleUrl?: string | null;
  aiSummary?: string | null;
}

export interface Section {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface CourseMetrics {
  durationHours: number;
  lessonCount: number;
  enrollmentCount: number;
  rating: number;
  reviewCount: number;
  completionRate: number;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  instructor: CourseInstructor;
  category: Category | null;
  level: CourseLevel;
  language: string;
  price: number;
  discountPrice?: number | null;
  isFree: boolean;
  thumbnailUrl?: string | null;
  promoVideoUrl?: string | null;
  tags: string[];
  requirements: string[];
  objectives: string[];
  targetAudience: string[];
  state: CourseState;
  publishedAt?: string | null;
  metrics: CourseMetrics;
  dripEnabled: boolean;
  aiDescription?: string | null;
  embedding: number[];
  sections: Section[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseListItem {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string | null;
  instructor: Pick<CourseInstructor, 'id' | 'username' | 'fullName' | 'avatarUrl'>;
  category: Pick<Category, 'id' | 'name' | 'slug' | 'icon'> | null;
  level: CourseLevel;
  language: string;
  price: number;
  discountPrice?: number | null;
  isFree: boolean;
  thumbnailUrl?: string | null;
  state: 'published';
  publishedAt?: string | null;
  metrics: Pick<CourseMetrics, 'durationHours' | 'lessonCount' | 'enrollmentCount' | 'rating' | 'reviewCount'>;
}

export interface ListCoursesQuery {
  page?: number;
  limit?: number;
  categorySlug?: string;
  level?: CourseLevel;
  q?: string;
  isFree?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'popular' | 'new';
}

export interface ListCoursesResponse {
  items: CourseListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CreateCourseRequest {
  title: string;
  description?: string | null;
  shortDescription?: string | null;
  categoryId?: string | null;
  level: CourseLevel;
  language: string;
  price: number;
  discountPrice?: number | null;
  isFree: boolean;
  thumbnailUrl?: string | null;
  promoVideoUrl?: string | null;
  tags?: string[];
  requirements?: string[];
  objectives?: string[];
  targetAudience?: string[];
  dripEnabled?: boolean;
  aiDescription?: string | null;
}

export type CreateCourseResponse = Course;

export type UpdateCourseRequest = Partial<CreateCourseRequest> & {
  state?: Exclude<CourseState, 'published'>;
};

export type UpdateCourseResponse = Course;

export interface AddSectionRequest {
  title: string;
  order?: number;
}

export type AddSectionResponse = Course;

export interface UpdateSectionRequest {
  title?: string;
  order?: number;
}

export type UpdateSectionResponse = Course;

export type DeleteSectionResponse = { ok: true };

export interface AddLessonRequest {
  title: string;
  order?: number;
  type: LessonType;
  videoId?: string | null;
  videoDuration?: number | null;
  content?: string | null;
  isFreePreview?: boolean;
  dripDays?: number | null;
  quiz?: LessonQuiz | null;
  codeExercise?: LessonCodeExercise | null;
  resourceUrls?: string[];
  transcript?: string | null;
  subtitleUrl?: string | null;
  aiSummary?: string | null;
}

export type AddLessonResponse = Course;

export type UpdateLessonRequest = Partial<AddLessonRequest>;

export type UpdateLessonResponse = Course;

export type DeleteLessonResponse = { ok: true };

export type PublishCourseResponse = Course;

export interface EnrollmentLessonProgress {
  lessonId: string;
  isCompleted: boolean;
  watchPercentage: number;
  lastPositionSeconds: number;
  quizScore?: number | null;
  completedAt?: string | null;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrolledAt: string;
  completedAt?: string | null;
  lastActivity?: string | null;
  progressPercentage: number;
  isCompleted: boolean;
  amountPaid: number;
  paymentId?: string | null;
  certificateId?: string | null;
  lessonProgress: EnrollmentLessonProgress[];
}

export type EnrollCourseResponse = Enrollment;

export interface MyCourseEnrollment {
  id: string;
  enrolledAt: string;
  lastActivity: string | null;
  progressPercentage: number;
  isCompleted: boolean;
  completedAt: string | null;
}

export interface MyCourseItem {
  course: CourseListItem;
  enrollment: MyCourseEnrollment;
  lastLessonId: string | null;
}

export interface ListMyCoursesQuery {
  page?: number;
  limit?: number;
}

export interface ListMyCoursesResponse {
  items: MyCourseItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GetCourseLessonsResponse {
  courseId: string;
  sections: Section[];
}

export interface LessonProgressRequest {
  watchPercentage: number;
  lastPositionSeconds: number;
  quizScore?: number | null;
}

export type LessonProgressResponse = { ok: true };

export type LessonCompleteResponse = {
  ok: true;
  progressPercentage: number;
  isCompleted: boolean;
};

