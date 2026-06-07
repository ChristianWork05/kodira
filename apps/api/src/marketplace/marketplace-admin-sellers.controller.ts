import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type {
  ListAdminSellersResponse,
  SellerProfileResponse,
} from '@kodira/types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from '../users/schemas/user.schema';
import { MarketplaceSellersService } from './marketplace-sellers.service';
import { ListAdminSellersQueryDto } from './dto/list-admin-sellers.query';
import { ListAdminSellersResponseDto } from './dto/list-admin-sellers-response.dto';
import { SellerProfileResponseDto } from './dto/seller-profile-response.dto';

@ApiTags('Marketplace Admin')
@Controller('admin')
export class MarketplaceAdminSellersController {
  constructor(private readonly sellers: MarketplaceSellersService) {}

  @Get('sellers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('bearer')
  @ApiOkResponse({ type: ListAdminSellersResponseDto })
  async listAdminSellers(
    @Query() query: ListAdminSellersQueryDto,
  ): Promise<ListAdminSellersResponse> {
    const status = query.status ?? 'pending';
    const items = await this.sellers.listByStatus(status);
    return { items };
  }

  @Post('sellers/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('bearer')
  @ApiOkResponse({ type: SellerProfileResponseDto })
  async approveSeller(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ): Promise<SellerProfileResponse> {
    const seller = await this.sellers.approve(id, user._id.toString());
    return { seller };
  }

  @Post('sellers/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('bearer')
  @ApiOkResponse({ type: SellerProfileResponseDto })
  async rejectSeller(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ): Promise<SellerProfileResponse> {
    const seller = await this.sellers.reject(id, user._id.toString());
    return { seller };
  }
}

