import type {
  Category as CategoryType,
  Course as CourseType,
  CourseListItem,
  CourseInstructor,
  Lesson as LessonType,
  Section as SectionType,
} from '@kodira/types';
import type { CategoryDocument } from './schemas/category.schema';
import type { CourseDocument, Lesson, Section } from './schemas/course.schema';

function toIso(value: Date | undefined | null) {
  return value ? value.toISOString() : null;
}

export function toCategory(doc: CategoryDocument): CategoryType {
  const obj = doc.toObject({ virtuals: false }) as any;
  return {
    id: obj._id.toString(),
    name: obj.name,
    slug: obj.slug,
    icon: obj.icon ?? null,
    order: obj.order ?? 0,
    createdAt: (doc as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
    updatedAt: (doc as any).updatedAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

function toLesson(lesson: Lesson): LessonType {
  const obj = (lesson as any).toObject ? (lesson as any).toObject() : lesson;
  return {
    id: obj._id.toString(),
    title: obj.title,
    order: obj.order ?? 0,
    type: obj.type,
    videoId: obj.videoId ?? null,
    videoUrl: obj.videoUrl ?? null,
    videoDuration: obj.videoDuration ?? null,
    content: obj.content ?? null,
    isFreePreview: obj.isFreePreview ?? false,
    dripDays: obj.dripDays ?? null,
    quiz: obj.quiz ?? null,
    codeExercise: obj.codeExercise ?? null,
    resourceUrls: obj.resourceUrls ?? [],
    transcript: obj.transcript ?? null,
    subtitleUrl: obj.subtitleUrl ?? null,
    aiSummary: obj.aiSummary ?? null,
  };
}

function toSection(section: Section): SectionType {
  const obj = (section as any).toObject ? (section as any).toObject() : section;
  return {
    id: obj._id.toString(),
    title: obj.title,
    order: obj.order ?? 0,
    lessons: (obj.lessons ?? []).map((l: Lesson) => toLesson(l)),
  };
}

export function toCourse(doc: CourseDocument, populated?: {
  instructor?: CourseInstructor;
  category?: CategoryType | null;
}): CourseType {
  const obj = doc.toObject({ virtuals: false }) as any;
  const instructor = populated?.instructor as any;
  const category = populated?.category as any;

  return {
    id: obj._id.toString(),
    title: obj.title,
    slug: obj.slug,
    description: obj.description ?? null,
    shortDescription: obj.shortDescription ?? null,
    instructor,
    category: category ?? null,
    level: obj.level,
    language: obj.language,
    price: obj.price ?? 0,
    discountPrice: obj.discountPrice ?? null,
    isFree: obj.isFree ?? false,
    thumbnailUrl: obj.thumbnailUrl ?? null,
    promoVideoUrl: obj.promoVideoUrl ?? null,
    tags: obj.tags ?? [],
    requirements: obj.requirements ?? [],
    objectives: obj.objectives ?? [],
    targetAudience: obj.targetAudience ?? [],
    state: obj.state,
    publishedAt: toIso(obj.publishedAt),
    metrics: {
      durationHours: obj.metrics?.durationHours ?? 0,
      lessonCount: obj.metrics?.lessonCount ?? 0,
      enrollmentCount: obj.metrics?.enrollmentCount ?? 0,
      rating: obj.metrics?.rating ?? 0,
      reviewCount: obj.metrics?.reviewCount ?? 0,
      completionRate: obj.metrics?.completionRate ?? 0,
    },
    dripEnabled: obj.dripEnabled ?? false,
    aiDescription: obj.aiDescription ?? null,
    embedding: obj.embedding ?? [],
    sections: (obj.sections ?? []).map((s: Section) => toSection(s)),
    createdAt: (doc as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
    updatedAt: (doc as any).updatedAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

export function toCourseListItem(params: {
  doc: CourseDocument;
  instructor: Pick<CourseInstructor, 'id' | 'username' | 'fullName' | 'avatarUrl'>;
  category: CategoryType | null;
}): CourseListItem {
  const obj = params.doc.toObject({ virtuals: false });
  return {
    id: obj._id.toString(),
    title: obj.title,
    slug: obj.slug,
    shortDescription: obj.shortDescription ?? null,
    instructor: params.instructor,
    category: params.category
      ? {
          id: params.category.id,
          name: params.category.name,
          slug: params.category.slug,
          icon: params.category.icon ?? null,
        }
      : null,
    level: obj.level,
    language: obj.language,
    price: obj.price ?? 0,
    discountPrice: obj.discountPrice ?? null,
    isFree: obj.isFree ?? false,
    thumbnailUrl: obj.thumbnailUrl ?? null,
    state: 'published',
    publishedAt: toIso(obj.publishedAt),
    metrics: {
      durationHours: obj.metrics?.durationHours ?? 0,
      lessonCount: obj.metrics?.lessonCount ?? 0,
      enrollmentCount: obj.metrics?.enrollmentCount ?? 0,
      rating: obj.metrics?.rating ?? 0,
      reviewCount: obj.metrics?.reviewCount ?? 0,
    },
  };
}

