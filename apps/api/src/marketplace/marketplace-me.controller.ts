import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import type {
  CreateDigitalAssetResponse,
  CreateOfferingUploadUrlResponse,
  CreateSellerOfferingResponse,
  ListSellerOfferingsResponse,
  SellerProfileResponse,
  SubmitSellerOfferingResponse,
  UpdateSellerOfferingResponse,
} from '@kodira/types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from '../users/schemas/user.schema';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MarketplaceSellersService } from './marketplace-sellers.service';
import { SellerProfileResponseDto } from './dto/seller-profile-response.dto';
import { MarketplaceOfferingsService } from './marketplace-offerings.service';
import { CreateOfferingDto } from './dto/create-offering.dto';
import { OfferingResponseDto } from './dto/offering-response.dto';
import { UpdateOfferingDto } from './dto/update-offering.dto';
import { ListSellerOfferingsQueryDto } from './dto/list-seller-offerings.query';
import { ListOfferingsResponseDto } from './dto/list-offerings-response.dto';
import { CreateOfferingUploadUrlDto } from './dto/create-offering-upload-url.dto';
import { CreateUploadUrlResponseDto } from './dto/create-upload-url-response.dto';
import { MarketplaceAssetsService } from './marketplace-assets.service';
import { CreateDigitalAssetDto } from './dto/create-digital-asset.dto';
import { DigitalAssetResponseDto } from './dto/digital-asset-response.dto';

@ApiTags('Marketplace Me')
@Controller('me')
export class MarketplaceMeController {
  constructor(
    private readonly sellers: MarketplaceSellersService,
    private readonly offerings: MarketplaceOfferingsService,
    private readonly assets: MarketplaceAssetsService,
  ) {}

  @Get('seller')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOkResponse({ type: SellerProfileResponseDto })
  async mySeller(@CurrentUser() user: UserDocument): Promise<SellerProfileResponse> {
    const seller = await this.sellers.getByUserId(user._id.toString());
    return { seller };
  }

  @Post('seller/offerings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  @ApiBearerAuth('bearer')
  @ApiOkResponse({ type: OfferingResponseDto })
  async createOffering(
    @CurrentUser() user: UserDocument,
    @Body() body: CreateOfferingDto,
  ): Promise<CreateSellerOfferingResponse> {
    const offering = await this.offerings.createDraftOffering(
      user._id.toString(),
      body,
    );
    return { offering };
  }

  @Patch('seller/offerings/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  @ApiBearerAuth('bearer')
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: OfferingResponseDto })
  async updateOffering(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
    @Body() body: UpdateOfferingDto,
  ): Promise<UpdateSellerOfferingResponse> {
    const offering = await this.offerings.updateOffering({
      userId: user._id.toString(),
      offeringId: id,
      input: body,
    });
    return { offering };
  }

  @Get('seller/offerings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  @ApiBearerAuth('bearer')
  @ApiOkResponse({ type: ListOfferingsResponseDto })
  async listMyOfferings(
    @CurrentUser() user: UserDocument,
    @Query() query: ListSellerOfferingsQueryDto,
  ): Promise<ListSellerOfferingsResponse> {
    return this.offerings.listSellerOfferings({ userId: user._id.toString(), query });
  }

  @Post('seller/offerings/:id/submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  @ApiBearerAuth('bearer')
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: OfferingResponseDto })
  async submitOffering(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ): Promise<SubmitSellerOfferingResponse> {
    const offering = await this.offerings.submitOffering({
      userId: user._id.toString(),
      offeringId: id,
    });
    return { offering };
  }

  @Post('seller/offerings/:id/pause')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  @ApiBearerAuth('bearer')
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: OfferingResponseDto })
  async pauseOffering(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ): Promise<SubmitSellerOfferingResponse> {
    const offering = await this.offerings.pauseOffering({
      userId: user._id.toString(),
      offeringId: id,
    });
    return { offering };
  }

  @Post('seller/offerings/:id/unpause')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  @ApiBearerAuth('bearer')
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: OfferingResponseDto })
  async unpauseOffering(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ): Promise<SubmitSellerOfferingResponse> {
    const offering = await this.offerings.unpauseOffering({
      userId: user._id.toString(),
      offeringId: id,
    });
    return { offering };
  }

  @Post('seller/offerings/:id/asset/upload-url')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  @ApiBearerAuth('bearer')
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: CreateUploadUrlResponseDto })
  async createAssetUploadUrl(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
    @Body() body: CreateOfferingUploadUrlDto,
  ): Promise<CreateOfferingUploadUrlResponse> {
    return this.assets.createUploadUrl({
      userId: user._id.toString(),
      offeringId: id,
      input: body,
    });
  }

  @Post('seller/offerings/:id/asset')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  @ApiBearerAuth('bearer')
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: DigitalAssetResponseDto })
  async createDigitalAsset(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
    @Body() body: CreateDigitalAssetDto,
  ): Promise<CreateDigitalAssetResponse> {
    const asset = await this.assets.createAsset({
      userId: user._id.toString(),
      offeringId: id,
      input: body,
    });
    return { asset };
  }
}
