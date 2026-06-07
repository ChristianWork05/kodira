import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import type {
  ApproveOfferingResponse,
  ListAdminOfferingsResponse,
  RejectOfferingResponse,
} from '@kodira/types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ListAdminOfferingsQueryDto } from './dto/list-admin-offerings.query';
import { ListOfferingsResponseDto } from './dto/list-offerings-response.dto';
import { OfferingResponseDto } from './dto/offering-response.dto';
import { RejectOfferingDto } from './dto/reject-offering.dto';
import { MarketplaceOfferingsService } from './marketplace-offerings.service';

@ApiTags('Marketplace Admin')
@Controller('admin')
export class MarketplaceAdminOfferingsController {
  constructor(private readonly offerings: MarketplaceOfferingsService) {}

  @Get('offerings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('bearer')
  @ApiOkResponse({ type: ListOfferingsResponseDto })
  async list(
    @Query() query: ListAdminOfferingsQueryDto,
  ): Promise<ListAdminOfferingsResponse> {
    return this.offerings.listAdminOfferings(query);
  }

  @Post('offerings/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('bearer')
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: OfferingResponseDto })
  async approve(@Param('id') id: string): Promise<ApproveOfferingResponse> {
    const offering = await this.offerings.approveOffering({ offeringId: id });
    return { offering };
  }

  @Post('offerings/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('bearer')
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: OfferingResponseDto })
  async reject(
    @Param('id') id: string,
    @Body() body: RejectOfferingDto,
  ): Promise<RejectOfferingResponse> {
    const offering = await this.offerings.rejectOffering({
      offeringId: id,
      input: body,
    });
    return { offering };
  }
}

