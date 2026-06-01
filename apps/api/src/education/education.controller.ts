import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type {
  AddLessonResponse,
  AddSectionResponse,
  CreateCourseResponse,
  DeleteLessonResponse,
  DeleteSectionResponse,
  PublishCourseResponse,
  UpdateCourseResponse,
  UpdateLessonResponse,
  UpdateSectionResponse,
} from '@kodira/types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserOptional } from '../auth/decorators/current-user-optional.decorator';
import type { UserDocument } from '../users/schemas/user.schema';
import { EducationService } from './education.service';
import { ListCoursesQueryDto } from './dto/list-courses.query';
import { ListCoursesResponseDto } from './dto/list-courses-response.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { AddSectionDto, UpdateSectionDto } from './dto/section.dto';
import { AddLessonDto, UpdateLessonDto } from './dto/lesson.dto';
import { CourseDto } from './dto/course.dto';
import { CategoryDto } from './dto/category.dto';

@ApiTags('Courses')
@Controller('courses')
export class EducationController {
  constructor(private readonly education: EducationService) {}

  @Get()
  @ApiOkResponse({ type: ListCoursesResponseDto })
  async listCourses(@Query() query: ListCoursesQueryDto): Promise<ListCoursesResponseDto> {
    return this.education.listCourses(query);
  }

  @Get('categories')
  @ApiOkResponse({ type: [CategoryDto] })
  async listCategories(): Promise<CategoryDto[]> {
    return this.education.listCategories();
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiParam({ name: 'slug' })
  @ApiOkResponse({ type: CourseDto })
  async getCourseBySlug(
    @Param('slug') slug: string,
    @CurrentUserOptional() user: UserDocument | null,
  ): Promise<CourseDto> {
    return this.education.getCourseBySlugPublic({
      slug,
      viewerUserId: user?._id?.toString?.(),
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor')
  @ApiBearerAuth('bearer')
  @HttpCode(201)
  @ApiCreatedResponse({ type: CourseDto })
  async createCourse(
    @CurrentUser() user: UserDocument,
    @Body() body: CreateCourseDto,
  ): Promise<CreateCourseResponse> {
    const doc = await this.education.createCourse({
      instructorId: user._id.toString(),
      data: body,
    });
    return this.education.getCourseByIdForOwner({
      courseId: doc._id.toString(),
      instructorId: user._id.toString(),
    });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor')
  @ApiBearerAuth('bearer')
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: CourseDto })
  async updateCourse(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
    @Body() body: UpdateCourseDto,
  ): Promise<UpdateCourseResponse> {
    const doc = await this.education.updateCourse({
      courseId: id,
      instructorId: user._id.toString(),
      data: body,
    });
    return this.education.getCourseByIdForOwner({
      courseId: doc._id.toString(),
      instructorId: user._id.toString(),
    });
  }

  @Post(':id/sections')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor')
  @ApiBearerAuth('bearer')
  @ApiParam({ name: 'id' })
  @HttpCode(201)
  @ApiCreatedResponse({ type: CourseDto })
  async addSection(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
    @Body() body: AddSectionDto,
  ): Promise<AddSectionResponse> {
    const doc = await this.education.addSection({
      courseId: id,
      instructorId: user._id.toString(),
      title: body.title,
      order: body.order,
    });
    return this.education.getCourseByIdForOwner({
      courseId: doc._id.toString(),
      instructorId: user._id.toString(),
    });
  }

  @Put(':id/sections/:sectionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor')
  @ApiBearerAuth('bearer')
  @ApiOkResponse({ type: CourseDto })
  async updateSection(
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
    @CurrentUser() user: UserDocument,
    @Body() body: UpdateSectionDto,
  ): Promise<UpdateSectionResponse> {
    const doc = await this.education.updateSection({
      courseId: id,
      instructorId: user._id.toString(),
      sectionId,
      title: body.title,
      order: body.order,
    });
    return this.education.getCourseByIdForOwner({
      courseId: doc._id.toString(),
      instructorId: user._id.toString(),
    });
  }

  @Delete(':id/sections/:sectionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor')
  @ApiBearerAuth('bearer')
  @ApiOkResponse({ schema: { example: { ok: true } } })
  async deleteSection(
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
    @CurrentUser() user: UserDocument,
  ): Promise<DeleteSectionResponse> {
    return this.education.deleteSection({
      courseId: id,
      instructorId: user._id.toString(),
      sectionId,
    });
  }

  @Post(':id/sections/:sectionId/lessons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor')
  @ApiBearerAuth('bearer')
  @HttpCode(201)
  @ApiCreatedResponse({ type: CourseDto })
  async addLesson(
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
    @CurrentUser() user: UserDocument,
    @Body() body: AddLessonDto,
  ): Promise<AddLessonResponse> {
    const doc = await this.education.addLesson({
      courseId: id,
      instructorId: user._id.toString(),
      sectionId,
      data: body,
    });
    return this.education.getCourseByIdForOwner({
      courseId: doc._id.toString(),
      instructorId: user._id.toString(),
    });
  }

  @Put(':id/sections/:sectionId/lessons/:lessonId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor')
  @ApiBearerAuth('bearer')
  @ApiOkResponse({ type: CourseDto })
  async updateLesson(
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: UserDocument,
    @Body() body: UpdateLessonDto,
  ): Promise<UpdateLessonResponse> {
    const doc = await this.education.updateLesson({
      courseId: id,
      instructorId: user._id.toString(),
      sectionId,
      lessonId,
      data: body,
    });
    return this.education.getCourseByIdForOwner({
      courseId: doc._id.toString(),
      instructorId: user._id.toString(),
    });
  }

  @Delete(':id/sections/:sectionId/lessons/:lessonId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor')
  @ApiBearerAuth('bearer')
  @ApiOkResponse({ schema: { example: { ok: true } } })
  async deleteLesson(
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: UserDocument,
  ): Promise<DeleteLessonResponse> {
    return this.education.deleteLesson({
      courseId: id,
      instructorId: user._id.toString(),
      sectionId,
      lessonId,
    });
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor')
  @ApiBearerAuth('bearer')
  @ApiOkResponse({ type: CourseDto })
  async publishCourse(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ): Promise<PublishCourseResponse> {
    const doc = await this.education.publishCourse({
      courseId: id,
      instructorId: user._id.toString(),
    });
    return this.education.getCourseBySlugPublic({
      slug: doc.slug,
      viewerUserId: user._id.toString(),
    });
  }
}

