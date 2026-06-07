import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { MarketplaceSettingsResponse } from '@kodira/types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from '../users/schemas/user.schema';
import { MarketplaceSettingsService } from './marketplace-settings.service';
import { MarketplaceSettingsResponseDto } from './dto/marketplace-settings-response.dto';
import { UpdateCommissionDto } from './dto/update-commission.dto';

@ApiTags('Marketplace Admin')
@Controller('admin')
export class MarketplaceAdminSettingsController {
  constructor(private readonly settings: MarketplaceSettingsService) {}

  @Get('settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('bearer')
  @ApiOkResponse({ type: MarketplaceSettingsResponseDto })
  async getSettings(): Promise<MarketplaceSettingsResponse> {
    const settings = await this.settings.getSettings();
    return { settings };
  }

  @Patch('settings/commission')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('bearer')
  @ApiOkResponse({ type: MarketplaceSettingsResponseDto })
  async setCommission(
    @CurrentUser() user: UserDocument,
    @Body() dto: UpdateCommissionDto,
  ): Promise<MarketplaceSettingsResponse> {
    const settings = await this.settings.setCommission(
      dto.commissionPercent,
      user._id.toString(),
    );
    return { settings };
  }
}
