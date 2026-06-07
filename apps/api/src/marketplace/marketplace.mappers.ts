import type {
  DigitalAsset,
  MarketplaceSettings,
  Offering,
  Order,
  PublicOfferingCard,
  PublicOfferingDetail,
  PublicSellerCard,
  SellerProfile,
} from '@kodira/types';
import type { MarketplaceSettingsDocument } from './schemas/marketplace-settings.schema';
import type { SellerProfileDocument } from './schemas/seller-profile.schema';
import type { OfferingDocument } from './schemas/offering.schema';
import type { DigitalAssetDocument } from './schemas/digital-asset.schema';
import type { OrderDocument } from './schemas/order.schema';

export function mapSellerProfile(doc: SellerProfileDocument): SellerProfile {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    displayName: doc.displayName,
    bio: doc.bio ?? null,
    avatarUrl: doc.avatarUrl ?? null,
    categories: doc.categories ?? [],
    status: doc.status,
    payoutAccountId: doc.payoutAccountId ?? null,
    payoutProvider: doc.payoutProvider ?? null,
    ratingAvg: doc.ratingAvg,
    salesCount: doc.salesCount,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function mapMarketplaceSettings(
  doc: MarketplaceSettingsDocument,
): MarketplaceSettings {
  return {
    commissionPercent: doc.commissionPercent,
    updatedBy: doc.updatedBy ? doc.updatedBy.toString() : null,
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function mapOffering(doc: OfferingDocument): Offering {
  return {
    id: doc._id.toString(),
    sellerId: doc.sellerId.toString(),
    type: doc.type,
    title: doc.title,
    slug: doc.slug,
    description: doc.description,
    category: doc.category,
    coverImageUrl: doc.coverImageUrl ?? null,
    gallery: doc.gallery ?? [],
    status: doc.status,
    rejectionReason: doc.rejectionReason ?? null,
    price: doc.price ?? null,
    currency: doc.currency,
    deliveryDays: doc.deliveryDays ?? null,
    deliverables: doc.deliverables ?? [],
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function mapDigitalAsset(doc: DigitalAssetDocument): DigitalAsset {
  return {
    id: doc._id.toString(),
    offeringId: doc.offeringId.toString(),
    fileKey: doc.fileKey,
    fileName: doc.fileName,
    sizeBytes: doc.sizeBytes,
    version: doc.version,
    licenseTerms: doc.licenseTerms,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function mapOrder(doc: OrderDocument): Order {
  return {
    id: doc._id.toString(),
    buyerId: doc.buyerId.toString(),
    sellerId: doc.sellerId.toString(),
    offeringId: doc.offeringId.toString(),
    type: doc.type,
    amount: doc.amount,
    commissionAmount: doc.commissionAmount,
    sellerAmount: doc.sellerAmount,
    currency: doc.currency,
    paymentStatus: doc.paymentStatus,
    fulfillmentStatus: doc.fulfillmentStatus,
    paymentProvider: doc.paymentProvider ?? null,
    paymentIntentId: doc.paymentIntentId ?? null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function mapPublicSellerCard(doc: SellerProfileDocument): PublicSellerCard {
  return {
    id: doc._id.toString(),
    displayName: doc.displayName,
    avatarUrl: doc.avatarUrl ?? null,
    ratingAvg: doc.ratingAvg,
    salesCount: doc.salesCount,
  };
}

export function mapPublicOfferingCard(params: {
  offering: OfferingDocument;
  seller: SellerProfileDocument;
}): PublicOfferingCard {
  const { offering, seller } = params;
  return {
    id: offering._id.toString(),
    slug: offering.slug,
    type: offering.type,
    title: offering.title,
    description: offering.description,
    category: offering.category,
    coverImageUrl: offering.coverImageUrl ?? null,
    price: offering.price ?? null,
    currency: offering.currency,
    deliveryDays: offering.deliveryDays ?? null,
    seller: mapPublicSellerCard(seller),
    createdAt: offering.createdAt.toISOString(),
  };
}

export function mapPublicOfferingDetail(params: {
  offering: OfferingDocument;
  seller: SellerProfileDocument;
  assets?: DigitalAssetDocument[];
}): PublicOfferingDetail {
  const { offering, seller, assets } = params;
  return {
    ...mapPublicOfferingCard({ offering, seller }),
    gallery: offering.gallery ?? [],
    deliverables: offering.deliverables ?? [],
    rejectionReason: offering.rejectionReason ?? null,
    assets: assets
      ? assets.map((a) => ({
          fileName: a.fileName,
          sizeBytes: a.sizeBytes,
          version: a.version,
          licenseTerms: a.licenseTerms,
        }))
      : undefined,
  };
}
