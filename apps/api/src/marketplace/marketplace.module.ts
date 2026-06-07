import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { StorageModule } from '../storage/storage.module';
import { MarketplaceSellersController } from './marketplace-sellers.controller';
import { MarketplaceMeController } from './marketplace-me.controller';
import { MarketplaceAdminSettingsController } from './marketplace-admin-settings.controller';
import { MarketplaceAdminSellersController } from './marketplace-admin-sellers.controller';
import { MarketplaceAdminOfferingsController } from './marketplace-admin-offerings.controller';
import { MarketplacePublicOfferingsController } from './marketplace-public-offerings.controller';
import { MarketplacePublicSellersController } from './marketplace-public-sellers.controller';
import { MarketplaceSellersService } from './marketplace-sellers.service';
import { MarketplaceSettingsService } from './marketplace-settings.service';
import { MarketplaceOfferingsService } from './marketplace-offerings.service';
import { MarketplaceAssetsService } from './marketplace-assets.service';
import { MarketplacePublicService } from './marketplace-public.service';
import { SellerProfile, SellerProfileSchema } from './schemas/seller-profile.schema';
import { Offering, OfferingSchema } from './schemas/offering.schema';
import { DigitalAsset, DigitalAssetSchema } from './schemas/digital-asset.schema';
import { ServiceRequest, ServiceRequestSchema } from './schemas/service-request.schema';
import { Quote, QuoteSchema } from './schemas/quote.schema';
import { Order, OrderSchema } from './schemas/order.schema';
import { Review, ReviewSchema } from './schemas/review.schema';
import {
  MarketplaceSettings,
  MarketplaceSettingsSchema,
} from './schemas/marketplace-settings.schema';

@Module({
  imports: [
    UsersModule,
    StorageModule,
    MongooseModule.forFeature([
      { name: SellerProfile.name, schema: SellerProfileSchema },
      { name: Offering.name, schema: OfferingSchema },
      { name: DigitalAsset.name, schema: DigitalAssetSchema },
      { name: ServiceRequest.name, schema: ServiceRequestSchema },
      { name: Quote.name, schema: QuoteSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: MarketplaceSettings.name, schema: MarketplaceSettingsSchema },
    ]),
  ],
  controllers: [
    MarketplaceSellersController,
    MarketplaceMeController,
    MarketplaceAdminSellersController,
    MarketplaceAdminSettingsController,
    MarketplaceAdminOfferingsController,
    MarketplacePublicOfferingsController,
    MarketplacePublicSellersController,
  ],
  providers: [
    MarketplaceSellersService,
    MarketplaceSettingsService,
    MarketplaceOfferingsService,
    MarketplaceAssetsService,
    MarketplacePublicService,
  ],
})
export class MarketplaceModule {}
