import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { FilterQuery, Model } from 'mongoose';
import { Types } from 'mongoose';
import type {
  CourseInstructor,
  CourseLevel,
  CourseState,
  LessonType,
  ListCoursesQuery,
  ListCoursesResponse,
} from '@kodira/types';
import { Course } from './schemas/course.schema';
import type { CourseDocument, Lesson, Section } from './schemas/course.schema';
import { Category } from './schemas/category.schema';
import type { CategoryDocument } from './schemas/category.schema';
import { slugifyTitle } from './education.utils';
import { toCategory, toCourse, toCourseListItem } from './education.mappers';
type CoursePopulateUser = CourseInstructor;

@Injectable()
export class EducationService {
  constructor(
    @InjectModel(Course.name) private readonly courseModel: Model<Course>,
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
  ) {}

  async listCategories() {
    const docs = await this.categoryModel.find({}).sort({ order: 1, name: 1 }).exec();
    return docs.map((d) => toCategory(d));
  }

  async listCourses(query: ListCoursesQuery): Promise<ListCoursesResponse> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 50) : 20;
    const skip = (page - 1) * limit;

    const filter: FilterQuery<Course> = { state: 'published' };

    if (query.categorySlug) {
      const cat = await this.categoryModel.findOne({ slug: query.categorySlug }).exec();
      filter.category = cat ? cat._id : new Types.ObjectId('000000000000000000000000');
    }

    if (query.level) filter.level = query.level as CourseLevel;

    if (typeof query.isFree === 'boolean') filter.isFree = query.isFree;

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const min = query.minPrice ?? 0;
      const max = query.maxPrice ?? Number.MAX_SAFE_INTEGER;
      filter.price = { $gte: min, $lte: max };
    }

    const sort =
      query.sort === 'new'
        ? { publishedAt: -1 }
        : { 'metrics.enrollmentCount': -1, publishedAt: -1 };

    const textQuery = query.q?.trim();
    const textFilter = textQuery && textQuery.length > 0 ? { $text: { $search: textQuery } } : {};

    const combinedFilter: FilterQuery<Course> = { ...filter, ...(textFilter as any) };

    const [total, docs] = await Promise.all([
      this.courseModel.countDocuments(combinedFilter).exec(),
      this.courseModel
        .find(combinedFilter)
        .sort(sort as any)
        .skip(skip)
        .limit(limit)
        .populate('instructor', 'username fullName avatarUrl bio roles xp currentStreak createdAt')
        .populate('category')
        .exec(),
    ]);

    const items = docs.map((doc) => {
      const instructorDoc = doc.get('instructor') as any;
      const categoryDoc = doc.get('category') as any;
      const instructor: CoursePopulateUser = {
        id: instructorDoc?._id?.toString?.() ?? '',
        username: instructorDoc?.username ?? '',
        fullName: instructorDoc?.fullName ?? null,
        avatarUrl: instructorDoc?.avatarUrl ?? null,
        bio: instructorDoc?.bio ?? null,
        roles: instructorDoc?.roles ?? [],
        xp: instructorDoc?.xp ?? 0,
        currentStreak: instructorDoc?.currentStreak ?? 0,
        createdAt: instructorDoc?.createdAt?.toISOString?.() ?? new Date().toISOString(),
      };

      const category = categoryDoc?._id ? toCategory(categoryDoc as CategoryDocument) : null;
      return toCourseListItem({
        doc,
        instructor: {
          id: instructor.id,
          username: instructor.username,
          fullName: instructor.fullName ?? null,
          avatarUrl: instructor.avatarUrl ?? null,
        },
        category,
      });
    });

    const totalPages = Math.max(1, Math.ceil(total / limit));
    return { items, page, limit, total, totalPages };
  }

  async getCourseBySlugPublic(params: { slug: string; viewerUserId?: string }) {
    const doc = await this.courseModel
      .findOne({ slug: params.slug, state: 'published' })
      .populate('instructor', 'username fullName avatarUrl bio roles xp currentStreak createdAt')
      .populate('category')
      .exec();
    if (!doc) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Course not found' });
    }

    const instructorDoc = doc.get('instructor') as any;
    const categoryDoc = doc.get('category') as any;
    const instructor: CourseInstructor = {
      id: instructorDoc?._id?.toString?.() ?? '',
      username: instructorDoc?.username ?? '',
      fullName: instructorDoc?.fullName ?? null,
      avatarUrl: instructorDoc?.avatarUrl ?? null,
      bio: instructorDoc?.bio ?? null,
      roles: instructorDoc?.roles ?? [],
      xp: instructorDoc?.xp ?? 0,
      currentStreak: instructorDoc?.currentStreak ?? 0,
      createdAt: instructorDoc?.createdAt?.toISOString?.() ?? new Date().toISOString(),
    };

    const category = categoryDoc?._id ? toCategory(categoryDoc as CategoryDocument) : null;

    const owner =
      params.viewerUserId && doc.instructor?.toString?.() === params.viewerUserId.toString();
    const course = toCourse(doc, { instructor, category });
    if (!owner) return this.sanitizeCourseForPublic(course);
    return course;
  }

  async getCourseByIdForOwner(params: { courseId: string; instructorId: string }) {
    const doc = await this.courseModel
      .findById(params.courseId)
      .select('+sections.lessons.codeExercise.solutionCode')
      .populate('instructor', 'username fullName avatarUrl bio roles xp currentStreak createdAt')
      .populate('category')
      .exec();
    if (!doc) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Course not found' });
    const instructorId =
      (doc.get('instructor') as any)?._id?.toString?.() ?? doc.instructor?.toString?.();
    if (!this.isOwner(instructorId, params.instructorId)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Not course owner' });
    }

    const instructorDoc = doc.get('instructor') as any;
    const categoryDoc = doc.get('category') as any;
    const instructor: CourseInstructor = {
      id: instructorDoc?._id?.toString?.() ?? '',
      username: instructorDoc?.username ?? '',
      fullName: instructorDoc?.fullName ?? null,
      avatarUrl: instructorDoc?.avatarUrl ?? null,
      bio: instructorDoc?.bio ?? null,
      roles: instructorDoc?.roles ?? [],
      xp: instructorDoc?.xp ?? 0,
      currentStreak: instructorDoc?.currentStreak ?? 0,
      createdAt: instructorDoc?.createdAt?.toISOString?.() ?? new Date().toISOString(),
    };
    const category = categoryDoc?._id ? toCategory(categoryDoc as CategoryDocument) : null;
    return toCourse(doc, { instructor, category });
  }

  async createCourse(params: {
    instructorId: string;
    data: {
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
    };
  }): Promise<CourseDocument> {
    const slug = await this.generateUniqueSlug(params.data.title);
    const created = await this.courseModel.create({
      title: params.data.title,
      slug,
      description: params.data.description ?? null,
      shortDescription: params.data.shortDescription ?? null,
      instructor: new Types.ObjectId(params.instructorId),
      category: params.data.categoryId ? new Types.ObjectId(params.data.categoryId) : null,
      level: params.data.level,
      language: params.data.language,
      price: params.data.price ?? 0,
      discountPrice: params.data.discountPrice ?? null,
      isFree: params.data.isFree ?? false,
      thumbnailUrl: params.data.thumbnailUrl ?? null,
      promoVideoUrl: params.data.promoVideoUrl ?? null,
      tags: params.data.tags ?? [],
      requirements: params.data.requirements ?? [],
      objectives: params.data.objectives ?? [],
      targetAudience: params.data.targetAudience ?? [],
      state: 'draft' as CourseState,
      publishedAt: null,
      dripEnabled: params.data.dripEnabled ?? false,
      aiDescription: params.data.aiDescription ?? null,
      embedding: [],
      sections: [],
    });
    return created;
  }

  async updateCourse(params: {
    courseId: string;
    instructorId: string;
    data: Partial<{
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
      tags: string[];
      requirements: string[];
      objectives: string[];
      targetAudience: string[];
      dripEnabled: boolean;
      aiDescription?: string | null;
      state: CourseState;
    }>;
  }): Promise<CourseDocument> {
    const course = await this.courseModel.findById(params.courseId).exec();
    if (!course) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Course not found' });
    if (!this.isOwner(course.instructor, params.instructorId)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Not course owner' });
    }

    if (params.data.title && params.data.title !== course.title && course.state !== 'published') {
      course.title = params.data.title;
      course.slug = await this.generateUniqueSlug(params.data.title, course._id.toString());
    } else if (params.data.title) {
      course.title = params.data.title;
    }

    if (params.data.description !== undefined) course.description = params.data.description ?? null;
    if (params.data.shortDescription !== undefined)
      course.shortDescription = params.data.shortDescription ?? null;
    if (params.data.categoryId !== undefined)
      course.category = params.data.categoryId ? new Types.ObjectId(params.data.categoryId) : null;
    if (params.data.level) course.level = params.data.level;
    if (params.data.language) course.language = params.data.language;
    if (params.data.price !== undefined) course.price = params.data.price;
    if (params.data.discountPrice !== undefined) course.discountPrice = params.data.discountPrice ?? null;
    if (params.data.isFree !== undefined) course.isFree = params.data.isFree;
    if (params.data.thumbnailUrl !== undefined) course.thumbnailUrl = params.data.thumbnailUrl ?? null;
    if (params.data.promoVideoUrl !== undefined) course.promoVideoUrl = params.data.promoVideoUrl ?? null;
    if (params.data.tags !== undefined) course.tags = params.data.tags ?? [];
    if (params.data.requirements !== undefined) course.requirements = params.data.requirements ?? [];
    if (params.data.objectives !== undefined) course.objectives = params.data.objectives ?? [];
    if (params.data.targetAudience !== undefined) course.targetAudience = params.data.targetAudience ?? [];
    if (params.data.dripEnabled !== undefined) course.dripEnabled = params.data.dripEnabled;
    if (params.data.aiDescription !== undefined) course.aiDescription = params.data.aiDescription ?? null;

    if (params.data.state && params.data.state !== course.state) {
      course.state = params.data.state;
      course.publishedAt = null;
    }

    await course.save();
    return course;
  }

  async addSection(params: { courseId: string; instructorId: string; title: string; order?: number }) {
    const course = await this.getOwnedCourse(params.courseId, params.instructorId);
    const nextOrder =
      params.order ?? (course.sections.length > 0 ? Math.max(...course.sections.map((s) => s.order ?? 0)) + 1 : 0);
    course.sections.push({ title: params.title, order: nextOrder, lessons: [] } as any);
    await course.save();
    return course;
  }

  async updateSection(params: {
    courseId: string;
    instructorId: string;
    sectionId: string;
    title?: string;
    order?: number;
  }) {
    const course = await this.getOwnedCourse(params.courseId, params.instructorId);
    const section = (course.sections as any).id(params.sectionId) as any as Section | null;
    if (!section) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Section not found' });
    if (params.title !== undefined) (section as any).title = params.title;
    if (params.order !== undefined) (section as any).order = params.order;
    await course.save();
    return course;
  }

  async deleteSection(params: { courseId: string; instructorId: string; sectionId: string }) {
    const course = await this.getOwnedCourse(params.courseId, params.instructorId);
    const section = (course.sections as any).id(params.sectionId) as any;
    if (!section) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Section not found' });
    section.deleteOne();
    await course.save();
    return { ok: true as const };
  }

  async addLesson(params: {
    courseId: string;
    instructorId: string;
    sectionId: string;
    data: any;
  }) {
    const course = await this.getOwnedCourse(params.courseId, params.instructorId);
    const section = (course.sections as any).id(params.sectionId) as any as Section | null;
    if (!section) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Section not found' });

    const lessons = (section as any).lessons as Lesson[];
    const nextOrder =
      params.data.order ??
      (lessons.length > 0 ? Math.max(...lessons.map((l) => (l as any).order ?? 0)) + 1 : 0);

    lessons.push({
      title: params.data.title,
      order: nextOrder,
      type: params.data.type as LessonType,
      videoId: params.data.videoId ?? null,
      videoDuration: params.data.videoDuration ?? null,
      content: params.data.content ?? null,
      isFreePreview: params.data.isFreePreview ?? false,
      dripDays: params.data.dripDays ?? null,
      quiz: params.data.quiz ?? null,
      codeExercise: params.data.codeExercise ?? null,
      resourceUrls: params.data.resourceUrls ?? [],
      transcript: params.data.transcript ?? null,
      subtitleUrl: params.data.subtitleUrl ?? null,
      aiSummary: params.data.aiSummary ?? null,
    } as any);

    await course.save();
    return course;
  }

  async updateLesson(params: {
    courseId: string;
    instructorId: string;
    sectionId: string;
    lessonId: string;
    data: any;
  }) {
    const course = await this.getOwnedCourse(params.courseId, params.instructorId);
    const section = (course.sections as any).id(params.sectionId) as any as Section | null;
    if (!section) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Section not found' });
    const lesson = ((section as any).lessons as any).id(params.lessonId) as any as Lesson | null;
    if (!lesson) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Lesson not found' });

    for (const [key, value] of Object.entries(params.data ?? {})) (lesson as any)[key] = value;
    await course.save();
    return course;
  }

  async deleteLesson(params: { courseId: string; instructorId: string; sectionId: string; lessonId: string }) {
    const course = await this.getOwnedCourse(params.courseId, params.instructorId);
    const section = (course.sections as any).id(params.sectionId) as any as Section | null;
    if (!section) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Section not found' });
    const lesson = ((section as any).lessons as any).id(params.lessonId) as any;
    if (!lesson) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Lesson not found' });
    lesson.deleteOne();
    await course.save();
    return { ok: true as const };
  }

  async publishCourse(params: { courseId: string; instructorId: string }) {
    const course = await this.getOwnedCourse(params.courseId, params.instructorId);
    if (!course.thumbnailUrl) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'thumbnailUrl is required to publish' });
    }
    const lessonCount = course.sections.reduce((acc, s) => acc + ((s as any).lessons?.length ?? 0), 0);
    if (course.sections.length === 0 || lessonCount === 0) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Course must have at least one section with one lesson',
      });
    }

    const durationSeconds = course.sections.reduce((acc, s) => {
      const lessons = (s as any).lessons as Lesson[];
      return (
        acc +
        (lessons ?? []).reduce((a, l) => a + (typeof (l as any).videoDuration === 'number' ? (l as any).videoDuration : 0), 0)
      );
    }, 0);
    const durationHours = Math.round((durationSeconds / 3600) * 100) / 100;

    course.metrics.lessonCount = lessonCount;
    course.metrics.durationHours = durationHours;
    course.state = 'published' as CourseState;
    course.publishedAt = new Date();
    await course.save();
    return course;
  }

  async getOwnedCourse(courseId: string, instructorId: string) {
    const course = await this.courseModel.findById(courseId).select('+sections.lessons.codeExercise.solutionCode').exec();
    if (!course) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Course not found' });
    if (!this.isOwner(course.instructor, instructorId)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Not course owner' });
    }
    return course;
  }

  private isOwner(courseInstructor: unknown, userId: string) {
    if (!courseInstructor) return false;
    const equals = (courseInstructor as any)?.equals as ((other: any) => boolean) | undefined;
    if (typeof equals === 'function') {
      try {
        return equals.call(courseInstructor, new Types.ObjectId(userId));
      } catch {
        return false;
      }
    }
    const value =
      typeof courseInstructor === 'string'
        ? courseInstructor
        : (courseInstructor as any)?.toString?.();
    return typeof value === 'string' && value === userId;
  }

  private sanitizeCourseForPublic(course: any) {
    return {
      ...course,
      sections: course.sections.map((s: any) => ({
        ...s,
        lessons: s.lessons.map((l: any) => {
          const isFree = l.isFreePreview === true;
          const codeExercise = l.codeExercise ? { ...l.codeExercise, solutionCode: null } : null;
          if (isFree) return { ...l, codeExercise };
          return {
            ...l,
            videoId: null,
            videoDuration: null,
            content: null,
            quiz: null,
            codeExercise,
            resourceUrls: [],
            transcript: null,
            subtitleUrl: null,
            aiSummary: null,
          };
        }),
      })),
    };
  }

  private async generateUniqueSlug(title: string, excludeCourseId?: string) {
    const base = slugifyTitle(title);
    const existing = await this.courseModel
      .findOne({ slug: base, ...(excludeCourseId ? { _id: { $ne: new Types.ObjectId(excludeCourseId) } } : {}) })
      .select('_id')
      .exec();
    if (!existing) return base;

    for (let i = 2; i <= 50; i++) {
      const candidate = `${base}-${i}`;
      const found = await this.courseModel
        .findOne({ slug: candidate, ...(excludeCourseId ? { _id: { $ne: new Types.ObjectId(excludeCourseId) } } : {}) })
        .select('_id')
        .exec();
      if (!found) return candidate;
    }
    return `${base}-${Date.now()}`;
  }
}

