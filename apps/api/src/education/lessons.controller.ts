import { Body, Controller, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { LessonCompleteResponse, LessonProgressResponse } from '@kodira/types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from '../users/schemas/user.schema';
import { EnrollmentService } from './enrollment.service';
import { LessonProgressDto } from './dto/lesson-progress.dto';

@ApiTags('Lessons')
@Controller('lessons')
export class LessonsController {
  constructor(private readonly enrollments: EnrollmentService) {}

  @Post(':id/progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOkResponse({ schema: { example: { ok: true } } })
  async progress(
    @Param('id') lessonId: string,
    @CurrentUser() user: UserDocument,
    @Body() body: LessonProgressDto,
  ): Promise<LessonProgressResponse> {
    return this.enrollments.saveLessonProgress(user._id.toString(), lessonId, body);
  }

  @Post(':id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @HttpCode(200)
  @ApiOkResponse({ schema: { example: { ok: true, progressPercentage: 100, isCompleted: true } } })
  async complete(
    @Param('id') lessonId: string,
    @CurrentUser() user: UserDocument,
  ): Promise<LessonCompleteResponse> {
    return this.enrollments.completeLesson(user._id.toString(), lessonId);
  }
}

