import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import type { GetPublicSellerByIdResponse } from '@kodira/types';
import { PublicSellerResponseDto } from './dto/public-seller-response.dto';
import { MarketplacePublicService } from './marketplace-public.service';

@ApiTags('Marketplace Catalog')
@Controller('sellers')
export class MarketplacePublicSellersController {
  constructor(private readonly catalog: MarketplacePublicService) {}

  @Get(':id')
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: PublicSellerResponseDto })
  async byId(@Param('id') id: string): Promise<GetPublicSellerByIdResponse> {
    return this.catalog.getPublicSellerById(id);
  }
}

