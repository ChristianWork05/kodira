import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { SellerProfileResponse } from '@kodira/types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from '../users/schemas/user.schema';
import { MarketplaceSellersService } from './marketplace-sellers.service';
import { ApplySellerDto } from './dto/apply-seller.dto';
import { SellerProfileResponseDto } from './dto/seller-profile-response.dto';

@ApiTags('Marketplace Sellers')
@Controller('sellers')
export class MarketplaceSellersController {
  constructor(private readonly sellers: MarketplaceSellersService) {}

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOkResponse({ type: SellerProfileResponseDto })
  async apply(
    @CurrentUser() user: UserDocument,
    @Body() dto: ApplySellerDto,
  ): Promise<SellerProfileResponse> {
    const seller = await this.sellers.apply(user._id.toString(), dto);
    return { seller };
  }
}
