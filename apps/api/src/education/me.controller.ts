import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { ListMyCoursesResponse } from '@kodira/types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from '../users/schemas/user.schema';
import { EnrollmentService } from './enrollment.service';
import { ListMyCoursesQueryDto } from './dto/list-my-courses.query';
import { ListMyCoursesResponseDto } from './dto/list-my-courses-response.dto';

@ApiTags('Me')
@Controller('me')
export class EducationMeController {
  constructor(private readonly enrollments: EnrollmentService) {}

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
}

