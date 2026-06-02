import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Inject,
  Optional,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';
import type {
  Enrollment as EnrollmentType,
  EnrollmentLessonProgress,
  GetCourseLessonsResponse,
  LessonCompleteResponse,
  LessonProgressRequest,
  LessonProgressResponse,
  ListMyCoursesQuery,
  ListMyCoursesResponse,
  MyCourseItem,
} from '@kodira/types';
import { Course } from './schemas/course.schema';
import type { CourseDocument, Lesson, Section } from './schemas/course.schema';
import { Enrollment } from './schemas/enrollment.schema';
import type { EnrollmentDocument, LessonProgress } from './schemas/enrollment.schema';
import { toCourseListItem, toCategory } from './education.mappers';
import type { CategoryDocument } from './schemas/category.schema';
import { CERTIFICATE_QUEUE, type CertificateQueue } from './queues/certificates.constants';

@Injectable()
export class EnrollmentService {
  constructor(
    @InjectModel(Enrollment.name) private readonly enrollmentModel: Model<Enrollment>,
    @InjectModel(Course.name) private readonly courseModel: Model<Course>,
    @Optional() @Inject(CERTIFICATE_QUEUE) private readonly certificateQueue?: CertificateQueue,
  ) {}

  async enrollCourse(studentId: string, courseId: string): Promise<EnrollmentType> {
    const course = await this.courseModel.findById(courseId).exec();
    if (!course || course.state !== 'published') {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Course not found' });
    }

    if (!course.isFree) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Course is paid. Use checkout to enroll.',
      });
    }

    let created: EnrollmentDocument | null = null;
    try {
      created = await this.enrollmentModel.create({
        student: new Types.ObjectId(studentId),
        course: course._id,
        enrolledAt: new Date(),
        completedAt: null,
        lastActivity: new Date(),
        progressPercentage: 0,
        isCompleted: false,
        amountPaid: 0,
        payment: null,
        certificate: null,
        lessonProgress: [],
      });

      await this.courseModel
        .updateOne({ _id: course._id }, { $inc: { 'metrics.enrollmentCount': 1 } })
        .exec();
    } catch (err: any) {
      if (err?.code !== 11000) throw err;
    }

    const enrollment =
      created ??
      (await this.enrollmentModel
        .findOne(this.enrollmentFilter(studentId, courseId))
        .exec());
    if (!enrollment) {
      throw new BadRequestException({
        code: 'INTERNAL_ERROR',
        message: 'Enrollment not created',
      });
    }
    return this.toEnrollment(enrollment);
  }

  async listMyCourses(studentId: string, query: ListMyCoursesQuery): Promise<ListMyCoursesResponse> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 50) : 20;
    const skip = (page - 1) * limit;

    const filter = { student: new Types.ObjectId(studentId) };
    const [total, enrollments] = await Promise.all([
      this.enrollmentModel.countDocuments(filter).exec(),
      this.enrollmentModel
        .find(filter)
        .sort({ lastActivity: -1, enrolledAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
    ]);

    const courseIds = enrollments.map((e) => e.course);
    const courses = await this.courseModel
      .find({ _id: { $in: courseIds }, state: 'published' })
      .populate('instructor', 'username fullName avatarUrl')
      .populate('category')
      .exec();

    const courseById = new Map<string, CourseDocument>(
      courses.map((c) => [c._id.toString(), c as any]),
    );

    const items: MyCourseItem[] = enrollments
      .map((enrollment) => {
        const courseDoc = courseById.get(enrollment.course.toString());
        if (!courseDoc) return null;

        const instructorDoc = courseDoc.get('instructor') as any;
        const categoryDoc = courseDoc.get('category') as any;

        const category = categoryDoc?._id ? toCategory(categoryDoc as CategoryDocument) : null;
        const course = toCourseListItem({
          doc: courseDoc,
          instructor: {
            id: instructorDoc?._id?.toString?.() ?? '',
            username: instructorDoc?.username ?? '',
            fullName: instructorDoc?.fullName ?? null,
            avatarUrl: instructorDoc?.avatarUrl ?? null,
          },
          category,
        });

        const lastLessonId = this.getLastLessonId(enrollment);

        return {
          course,
          enrollment: {
            id: enrollment._id.toString(),
            enrolledAt: enrollment.enrolledAt.toISOString(),
            lastActivity: enrollment.lastActivity ? enrollment.lastActivity.toISOString() : null,
            progressPercentage: enrollment.progressPercentage ?? 0,
            isCompleted: enrollment.isCompleted ?? false,
            completedAt: enrollment.completedAt ? enrollment.completedAt.toISOString() : null,
          },
          lastLessonId,
        };
      })
      .filter(Boolean) as MyCourseItem[];

    const totalPages = Math.max(1, Math.ceil(total / limit));
    return { items, page, limit, total, totalPages };
  }

  async getCourseLessons(studentId: string, courseId: string): Promise<GetCourseLessonsResponse> {
    const course = await this.courseModel.findById(courseId).exec();
    if (!course || course.state !== 'published') {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Course not found' });
    }

    const enrollment = await this.enrollmentModel
      .findOne(this.enrollmentFilter(studentId, courseId))
      .exec();

    const sections = this.toSections(course.sections);
    if (enrollment) return { courseId, sections };

    return { courseId, sections: this.sanitizeSectionsForUnenrolled(sections) };
  }

  async saveLessonProgress(
    studentId: string,
    lessonId: string,
    body: LessonProgressRequest,
  ): Promise<LessonProgressResponse> {
    const { courseId } = await this.findCourseIdByLessonId(lessonId);
    const enrollment = await this.enrollmentModel
      .findOne(this.enrollmentFilter(studentId, courseId))
      .exec();
    if (!enrollment) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Not enrolled' });
    }

    const now = new Date();
    const progress = this.getOrCreateLessonProgress(enrollment, lessonId);
    progress.watchPercentage = body.watchPercentage;
    progress.lastPositionSeconds = body.lastPositionSeconds;
    progress.quizScore = body.quizScore ?? null;
    progress.lastActivityAt = now;

    enrollment.lastActivity = now;
    await enrollment.save();
    return { ok: true };
  }

  async completeLesson(studentId: string, lessonId: string): Promise<LessonCompleteResponse> {
    const { course, courseId } = await this.findCourseByLessonId(lessonId);
    const enrollment = await this.enrollmentModel
      .findOne(this.enrollmentFilter(studentId, courseId))
      .exec();
    if (!enrollment) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Not enrolled' });
    }

    const now = new Date();
    const progress = this.getOrCreateLessonProgress(enrollment, lessonId);
    progress.isCompleted = true;
    progress.completedAt = now;
    progress.lastActivityAt = now;

    enrollment.lastActivity = now;

    const totalLessons = this.countLessons(course);
    const completedLessons = this.countCompletedLessons(enrollment);
    const progressPercentage =
      totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;

    enrollment.progressPercentage = progressPercentage;

    const wasCompleted = enrollment.isCompleted === true;
    const nowCompleted = progressPercentage >= 100;
    if (nowCompleted && !wasCompleted) {
      enrollment.isCompleted = true;
      enrollment.completedAt = now;
      await enrollment.save();
      await this.enqueueCertificate(enrollment);
    } else {
      enrollment.isCompleted = nowCompleted;
      if (!nowCompleted) enrollment.completedAt = null;
      await enrollment.save();
    }

    return { ok: true, progressPercentage: enrollment.progressPercentage, isCompleted: enrollment.isCompleted };
  }

  private async enqueueCertificate(enrollment: EnrollmentDocument) {
    if (!this.certificateQueue) return;
    try {
      await this.certificateQueue.add(
        'generateCertificate',
        {
          enrollmentId: enrollment._id.toString(),
          studentId: enrollment.student.toString(),
          courseId: enrollment.course.toString(),
        },
        { attempts: 3, removeOnComplete: true },
      );
    } catch {
      return;
    }
  }

  private toEnrollment(doc: EnrollmentDocument): EnrollmentType {
    return {
      id: doc._id.toString(),
      studentId: doc.student.toString(),
      courseId: doc.course.toString(),
      enrolledAt: doc.enrolledAt.toISOString(),
      completedAt: doc.completedAt ? doc.completedAt.toISOString() : null,
      lastActivity: doc.lastActivity ? doc.lastActivity.toISOString() : null,
      progressPercentage: doc.progressPercentage ?? 0,
      isCompleted: doc.isCompleted ?? false,
      amountPaid: doc.amountPaid ?? 0,
      paymentId: doc.payment ? doc.payment.toString() : null,
      certificateId: doc.certificate ? doc.certificate.toString() : null,
      lessonProgress: (doc.lessonProgress ?? []).map((lp) => this.toLessonProgress(lp)),
    };
  }

  private toLessonProgress(doc: LessonProgress): EnrollmentLessonProgress {
    return {
      lessonId: doc.lessonId,
      isCompleted: doc.isCompleted ?? false,
      watchPercentage: doc.watchPercentage ?? 0,
      lastPositionSeconds: doc.lastPositionSeconds ?? 0,
      quizScore: doc.quizScore ?? null,
      completedAt: doc.completedAt ? doc.completedAt.toISOString() : null,
    };
  }

  private getLastLessonId(enrollment: EnrollmentDocument): string | null {
    const entries = enrollment.lessonProgress ?? [];
    if (entries.length === 0) return null;

    let best: LessonProgress | null = null;
    for (const e of entries) {
      if (!best) {
        best = e;
        continue;
      }
      const a = e.lastActivityAt?.getTime?.() ?? 0;
      const b = best.lastActivityAt?.getTime?.() ?? 0;
      if (a > b) best = e;
    }
    return best?.lessonId ?? null;
  }

  private getOrCreateLessonProgress(enrollment: EnrollmentDocument, lessonId: string): LessonProgress {
    const existing = (enrollment.lessonProgress ?? []).find((p) => p.lessonId === lessonId);
    if (existing) return existing;
    const created = {
      lessonId,
      isCompleted: false,
      watchPercentage: 0,
      lastPositionSeconds: 0,
      quizScore: null,
      completedAt: null,
      lastActivityAt: null,
    } as any as LessonProgress;
    enrollment.lessonProgress.push(created as any);
    return enrollment.lessonProgress[enrollment.lessonProgress.length - 1] as any;
  }

  private async findCourseIdByLessonId(lessonId: string): Promise<{ courseId: string }> {
    const objectId = this.parseObjectId(lessonId);
    const course = await this.courseModel
      .findOne({ 'sections.lessons._id': objectId, state: 'published' })
      .select('_id')
      .exec();
    if (!course) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Lesson not found' });
    return { courseId: course._id.toString() };
  }

  private async findCourseByLessonId(lessonId: string): Promise<{ courseId: string; course: CourseDocument }> {
    const objectId = this.parseObjectId(lessonId);
    const course = await this.courseModel
      .findOne({ 'sections.lessons._id': objectId, state: 'published' })
      .exec();
    if (!course) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Lesson not found' });
    return { courseId: course._id.toString(), course: course as any };
  }

  private parseObjectId(value: string) {
    try {
      return new Types.ObjectId(value);
    } catch {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Invalid id' });
    }
  }

  private enrollmentFilter(studentId: string, courseId: string) {
    return {
      student: this.parseObjectId(studentId),
      course: this.parseObjectId(courseId),
    };
  }

  private countLessons(course: CourseDocument) {
    return (course.sections ?? []).reduce((acc, s) => acc + (((s as any).lessons as Lesson[])?.length ?? 0), 0);
  }

  private countCompletedLessons(enrollment: EnrollmentDocument) {
    const unique = new Map<string, boolean>();
    for (const lp of enrollment.lessonProgress ?? []) {
      unique.set(lp.lessonId, lp.isCompleted === true);
    }
    let count = 0;
    for (const done of unique.values()) if (done) count += 1;
    return count;
  }

  private toSections(sections: Section[]): GetCourseLessonsResponse['sections'] {
    return (sections ?? []).map((s: any) => ({
      id: s._id.toString(),
      title: s.title,
      order: s.order ?? 0,
      lessons: ((s.lessons ?? []) as Lesson[]).map((l: any) => ({
        id: l._id.toString(),
        title: l.title,
        order: l.order ?? 0,
        type: l.type,
        videoId: l.videoId ?? null,
        videoDuration: l.videoDuration ?? null,
        content: l.content ?? null,
        isFreePreview: l.isFreePreview ?? false,
        dripDays: l.dripDays ?? null,
        quiz: l.quiz ?? null,
        codeExercise: l.codeExercise ? { ...l.codeExercise, solutionCode: null } : null,
        resourceUrls: l.resourceUrls ?? [],
        transcript: l.transcript ?? null,
        subtitleUrl: l.subtitleUrl ?? null,
        aiSummary: l.aiSummary ?? null,
      })),
    }));
  }

  private sanitizeSectionsForUnenrolled(sections: GetCourseLessonsResponse['sections']) {
    return sections.map((s) => ({
      ...s,
      lessons: s.lessons.map((l) => {
        if (l.isFreePreview) return l;
        return {
          ...l,
          videoId: null,
          videoDuration: null,
          content: null,
          quiz: null,
          resourceUrls: [],
          transcript: null,
          subtitleUrl: null,
          aiSummary: null,
        };
      }),
    }));
  }
}

