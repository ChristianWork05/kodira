import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Course, CourseSchema } from '../education/schemas/course.schema';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Course.name, schema: CourseSchema }])],
  controllers: [StorageController],
  providers: [StorageService],
})
export class StorageModule {}

