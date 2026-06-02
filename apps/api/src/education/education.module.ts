import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EducationController } from './education.controller';
import { EducationService } from './education.service';
import { Course, CourseSchema } from './schemas/course.schema';
import { Category, CategorySchema } from './schemas/category.schema';
import { Enrollment, EnrollmentSchema } from './schemas/enrollment.schema';
import { EducationMeController } from './me.controller';
import { LessonsController } from './lessons.controller';
import { EnrollmentService } from './enrollment.service';
import { CertificatesProcessor } from './queues/certificates.processor';
import { CERTIFICATE_QUEUE, CERTIFICATE_QUEUE_NAME } from './queues/certificates.constants';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
    ]),
    BullModule.registerQueue({ name: CERTIFICATE_QUEUE_NAME }),
  ],
  controllers: [EducationController, EducationMeController, LessonsController],
  providers: [
    EducationService,
    EnrollmentService,
    CertificatesProcessor,
    {
      provide: CERTIFICATE_QUEUE,
      inject: [getQueueToken(CERTIFICATE_QUEUE_NAME)],
      useFactory: (queue: Queue) => queue,
    },
  ],
  exports: [EducationService],
})
export class EducationModule {}

