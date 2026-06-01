import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { CourseLevel, CourseState, LessonType } from '@kodira/types';
import { COURSE_LEVELS, COURSE_STATES, LESSON_TYPES } from '@kodira/types';
import type { HydratedDocument, Types as MongooseTypes } from 'mongoose';
import { Types } from 'mongoose';

export type CourseDocument = HydratedDocument<Course>;

@Schema({ _id: true, timestamps: false })
export class LessonQuizQuestion {
  @Prop({ type: String, required: true })
  id!: string;

  @Prop({ type: String, required: true })
  prompt!: string;

  @Prop({ type: [String], default: [] })
  options!: string[];

  @Prop({ type: Number, required: true })
  correctOptionIndex!: number;
}

export const LessonQuizQuestionSchema = SchemaFactory.createForClass(LessonQuizQuestion);

@Schema({ _id: false, timestamps: false })
export class LessonQuiz {
  @Prop({ type: [LessonQuizQuestionSchema], default: [] })
  questions!: LessonQuizQuestion[];
}

export const LessonQuizSchema = SchemaFactory.createForClass(LessonQuiz);

@Schema({ _id: false, timestamps: false })
export class LessonCodeExercise {
  @Prop({ type: String, default: null })
  prompt?: string | null;

  @Prop({ type: String, default: null })
  starterCode?: string | null;

  @Prop({ type: String, default: null, select: false })
  solutionCode?: string | null;
}

export const LessonCodeExerciseSchema = SchemaFactory.createForClass(LessonCodeExercise);

@Schema({ _id: true, timestamps: false })
export class Lesson {
  @Prop({ type: String, required: true, trim: true })
  title!: string;

  @Prop({ type: Number, default: 0 })
  order!: number;

  @Prop({ type: String, enum: LESSON_TYPES, required: true })
  type!: LessonType;

  @Prop({ type: String, default: null })
  videoId?: string | null;

  @Prop({ type: Number, default: null })
  videoDuration?: number | null;

  @Prop({ type: String, default: null })
  content?: string | null;

  @Prop({ type: Boolean, default: false })
  isFreePreview!: boolean;

  @Prop({ type: Number, default: null })
  dripDays?: number | null;

  @Prop({ type: LessonQuizSchema, default: null })
  quiz?: LessonQuiz | null;

  @Prop({ type: LessonCodeExerciseSchema, default: null })
  codeExercise?: LessonCodeExercise | null;

  @Prop({ type: [String], default: [] })
  resourceUrls!: string[];

  @Prop({ type: String, default: null })
  transcript?: string | null;

  @Prop({ type: String, default: null })
  subtitleUrl?: string | null;

  @Prop({ type: String, default: null })
  aiSummary?: string | null;
}

export const LessonSchema = SchemaFactory.createForClass(Lesson);

@Schema({ _id: true, timestamps: false })
export class Section {
  @Prop({ type: String, required: true, trim: true })
  title!: string;

  @Prop({ type: Number, default: 0 })
  order!: number;

  @Prop({ type: [LessonSchema], default: [] })
  lessons!: Lesson[];
}

export const SectionSchema = SchemaFactory.createForClass(Section);

@Schema({ _id: false, timestamps: false })
export class CourseMetrics {
  @Prop({ type: Number, default: 0 })
  durationHours!: number;

  @Prop({ type: Number, default: 0 })
  lessonCount!: number;

  @Prop({ type: Number, default: 0 })
  enrollmentCount!: number;

  @Prop({ type: Number, default: 0 })
  rating!: number;

  @Prop({ type: Number, default: 0 })
  reviewCount!: number;

  @Prop({ type: Number, default: 0 })
  completionRate!: number;
}

export const CourseMetricsSchema = SchemaFactory.createForClass(CourseMetrics);

@Schema({ timestamps: true })
export class Course {
  @Prop({ type: String, required: true, trim: true })
  title!: string;

  @Prop({ type: String, required: true, unique: true, index: true })
  slug!: string;

  @Prop({ type: String, default: null })
  description?: string | null;

  @Prop({ type: String, default: null })
  shortDescription?: string | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  instructor!: MongooseTypes.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', default: null, index: true })
  category?: MongooseTypes.ObjectId | null;

  @Prop({ type: String, enum: COURSE_LEVELS, required: true })
  level!: CourseLevel;

  @Prop({ type: String, required: true })
  language!: string;

  @Prop({ type: Number, default: 0 })
  price!: number;

  @Prop({ type: Number, default: null })
  discountPrice?: number | null;

  @Prop({ type: Boolean, default: false })
  isFree!: boolean;

  @Prop({ type: String, default: null })
  thumbnailUrl?: string | null;

  @Prop({ type: String, default: null })
  promoVideoUrl?: string | null;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: [String], default: [] })
  requirements!: string[];

  @Prop({ type: [String], default: [] })
  objectives!: string[];

  @Prop({ type: [String], default: [] })
  targetAudience!: string[];

  @Prop({ type: String, enum: COURSE_STATES, default: 'draft', index: true })
  state!: CourseState;

  @Prop({ type: Date, default: null })
  publishedAt?: Date | null;

  @Prop({ type: CourseMetricsSchema, default: {} })
  metrics!: CourseMetrics;

  @Prop({ type: Boolean, default: false })
  dripEnabled!: boolean;

  @Prop({ type: String, default: null })
  aiDescription?: string | null;

  @Prop({ type: [Number], default: [] })
  embedding!: number[];

  @Prop({ type: [SectionSchema], default: [] })
  sections!: Section[];
}

export const CourseSchema = SchemaFactory.createForClass(Course);

CourseSchema.index({ slug: 1 }, { unique: true });
CourseSchema.index({ state: 1, publishedAt: -1 });
CourseSchema.index({ category: 1, state: 1, publishedAt: -1 });
CourseSchema.index({ instructor: 1, state: 1 });
CourseSchema.index(
  { title: 'text', shortDescription: 'text', description: 'text', tags: 'text' },
  { weights: { title: 10, shortDescription: 5, description: 3, tags: 2 } },
);

