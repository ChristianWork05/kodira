import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import type {
  GetPublicOfferingBySlugResponse,
  ListPublicOfferingsResponse,
} from '@kodira/types';
import { ListPublicOfferingsQueryDto } from './dto/list-public-offerings.query';
import { ListPublicOfferingsResponseDto } from './dto/list-public-offerings-response.dto';
import { PublicOfferingResponseDto } from './dto/public-offering-response.dto';
import { MarketplacePublicService } from './marketplace-public.service';

@ApiTags('Marketplace Catalog')
@Controller('offerings')
export class MarketplacePublicOfferingsController {
  constructor(private readonly catalog: MarketplacePublicService) {}

  @Get()
  @ApiOkResponse({ type: ListPublicOfferingsResponseDto })
  async list(
    @Query() query: ListPublicOfferingsQueryDto,
  ): Promise<ListPublicOfferingsResponse> {
    return this.catalog.listPublicOfferings(query);
  }

  @Get(':slug')
  @ApiParam({ name: 'slug' })
  @ApiOkResponse({ type: PublicOfferingResponseDto })
  async bySlug(
    @Param('slug') slug: string,
  ): Promise<GetPublicOfferingBySlugResponse> {
    return this.catalog.getPublicOfferingBySlug(slug);
  }
}

