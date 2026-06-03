import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { ListInstructorCoursesResponse, ListMyCoursesResponse } from '@kodira/types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from '../users/schemas/user.schema';
import { EnrollmentService } from './enrollment.service';
import { ListMyCoursesQueryDto } from './dto/list-my-courses.query';
import { ListMyCoursesResponseDto } from './dto/list-my-courses-response.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { EducationService } from './education.service';
import { ListInstructorCoursesQueryDto } from './dto/list-instructor-courses.query';
import { ListInstructorCoursesResponseDto } from './dto/list-instructor-courses-response.dto';

@ApiTags('Me')
@Controller('me')
export class EducationMeController {
  constructor(
    private readonly enrollments: EnrollmentService,
    private readonly education: EducationService,
  ) {}

  @Get('courses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOkResponse({ type: ListMyCoursesResponseDto })
  async myCourses(
    @CurrentUser() user: UserDocument,
    @Query() query: ListMyCoursesQueryDto,
  ): Promise<ListMyCoursesResponse> {
    return this.enrollments.listMyCourses(user._id.toString(), query);
  }

  @Get('instructor/courses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor')
  @ApiBearerAuth('bearer')
  @ApiOkResponse({ type: ListInstructorCoursesResponseDto })
  async myInstructorCourses(
    @CurrentUser() user: UserDocument,
    @Query() query: ListInstructorCoursesQueryDto,
  ): Promise<ListInstructorCoursesResponse> {
    return this.education.listInstructorCourses(user._id.toString(), query);
  }
}

