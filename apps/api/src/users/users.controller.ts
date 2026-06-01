import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { UserDocument } from './schemas/user.schema';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserMeDto } from './dto/user-me.dto';
import { PublicUserProfileDto } from './dto/public-user-profile.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { toPublicUserProfile, toUserMe } from './users.mappers';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOkResponse({ type: UserMeDto })
  async me(@CurrentUser() user: UserDocument): Promise<UserMeDto> {
    return toUserMe(user);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOkResponse({ type: UserMeDto })
  async updateMe(
    @CurrentUser() user: UserDocument,
    @Body() body: UpdateMyProfileDto,
  ): Promise<UserMeDto> {
    const updated = await this.usersService.updateProfile(user._id.toString(), {
      username: body.username,
      fullName: body.fullName,
      avatarUrl: body.avatarUrl,
      bio: body.bio,
      preferredLanguage: body.preferredLanguage,
      timezone: body.timezone,
      country: body.country,
    });
    return toUserMe(updated);
  }

  @Get(':username')
  @ApiParam({ name: 'username', example: 'kodi_dev' })
  @ApiOkResponse({ type: PublicUserProfileDto })
  async getPublicProfile(
    @Param('username') username: string,
  ): Promise<PublicUserProfileDto> {
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }
    return toPublicUserProfile(user);
  }
}

