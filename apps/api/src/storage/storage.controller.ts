import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { StorageCreateUploadUrlResponse } from '@kodira/types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from '../users/schemas/user.schema';
import { StorageService } from './storage.service';
import { StorageCreateUploadUrlDto } from './dto/create-upload-url.dto';
import { StorageCreateUploadUrlResponseDto } from './dto/upload-url-response.dto';

@ApiTags('Storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Post('upload-url')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('instructor')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiBearerAuth('bearer')
  @ApiOkResponse({ type: StorageCreateUploadUrlResponseDto })
  async createUploadUrl(
    @CurrentUser() user: UserDocument,
    @Body() body: StorageCreateUploadUrlDto,
  ): Promise<StorageCreateUploadUrlResponse> {
    return this.storage.createUploadUrl({
      userId: user._id.toString(),
      input: body,
    });
  }
}

