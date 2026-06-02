import { ApiProperty } from '@nestjs/swagger';
import type { Enrollment, EnrollmentLessonProgress } from '@kodira/types';

class EnrollmentLessonProgressDto implements EnrollmentLessonProgress {
  @ApiProperty()
  lessonId!: string;

  @ApiProperty({ example: false })
  isCompleted!: boolean;

  @ApiProperty({ example: 0 })
  watchPercentage!: number;

  @ApiProperty({ example: 0 })
  lastPositionSeconds!: number;

  @ApiProperty({ nullable: true })
  quizScore?: number | null;

  @ApiProperty({ nullable: true })
  completedAt?: string | null;
}

export class EnrollmentDto implements Enrollment {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  studentId!: string;

  @ApiProperty()
  courseId!: string;

  @ApiProperty()
  enrolledAt!: string;

  @ApiProperty({ nullable: true })
  completedAt?: string | null;

  @ApiProperty({ nullable: true })
  lastActivity?: string | null;

  @ApiProperty({ example: 0 })
  progressPercentage!: number;

  @ApiProperty({ example: false })
  isCompleted!: boolean;

  @ApiProperty({ example: 0 })
  amountPaid!: number;

  @ApiProperty({ nullable: true })
  paymentId?: string | null;

  @ApiProperty({ nullable: true })
  certificateId?: string | null;

  @ApiProperty({ type: [EnrollmentLessonProgressDto] })
  lessonProgress!: EnrollmentLessonProgressDto[];
}

