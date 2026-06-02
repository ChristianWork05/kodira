import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument, Types as MongooseTypes } from 'mongoose';
import { Types } from 'mongoose';

export type EnrollmentDocument = HydratedDocument<Enrollment>;

@Schema({ _id: false, timestamps: false })
export class LessonProgress {
  @Prop({ type: String, required: true })
  lessonId!: string;

  @Prop({ type: Boolean, default: false })
  isCompleted!: boolean;

  @Prop({ type: Number, default: 0 })
  watchPercentage!: number;

  @Prop({ type: Number, default: 0 })
  lastPositionSeconds!: number;

  @Prop({ type: Number, default: null })
  quizScore?: number | null;

  @Prop({ type: Date, default: null })
  completedAt?: Date | null;

  @Prop({ type: Date, default: null })
  lastActivityAt?: Date | null;
}

export const LessonProgressSchema = SchemaFactory.createForClass(LessonProgress);

@Schema({ timestamps: true })
export class Enrollment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  student!: MongooseTypes.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Course', required: true, index: true })
  course!: MongooseTypes.ObjectId;

  @Prop({ type: Date, default: () => new Date() })
  enrolledAt!: Date;

  @Prop({ type: Date, default: null })
  completedAt?: Date | null;

  @Prop({ type: Date, default: null })
  lastActivity?: Date | null;

  @Prop({ type: Number, default: 0 })
  progressPercentage!: number;

  @Prop({ type: Boolean, default: false })
  isCompleted!: boolean;

  @Prop({ type: Number, default: 0 })
  amountPaid!: number;

  @Prop({ type: Types.ObjectId, ref: 'Payment', default: null })
  payment?: MongooseTypes.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Certificate', default: null })
  certificate?: MongooseTypes.ObjectId | null;

  @Prop({ type: [LessonProgressSchema], default: [] })
  lessonProgress!: LessonProgress[];
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);
EnrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

