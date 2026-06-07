export const SELLER_PROFILE_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'suspended',
] as const;
export type SellerProfileStatus = (typeof SELLER_PROFILE_STATUSES)[number];

export const PAYOUT_PROVIDERS = ['stripe', 'mercadopago'] as const;
export type PayoutProvider = (typeof PAYOUT_PROVIDERS)[number];

export const OFFERING_TYPES = [
  'digital_product',
  'fixed_package',
  'custom_service',
] as const;
export type OfferingType = (typeof OFFERING_TYPES)[number];

export const OFFERING_STATUSES = [
  'draft',
  'pending',
  'published',
  'paused',
  'rejected',
] as const;
export type OfferingStatus = (typeof OFFERING_STATUSES)[number];

export const OFFERING_REVIEW_STATUSES = ['pending'] as const;
export type OfferingReviewStatus = (typeof OFFERING_REVIEW_STATUSES)[number];

export const SERVICE_REQUEST_STATUSES = [
  'open',
  'quoted',
  'accepted',
  'declined',
] as const;
export type ServiceRequestStatus = (typeof SERVICE_REQUEST_STATUSES)[number];

export const QUOTE_STATUSES = ['sent', 'accepted', 'declined', 'expired'] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const ORDER_PAYMENT_STATUSES = [
  'pending',
  'paid',
  'refunded',
  'failed',
] as const;
export type OrderPaymentStatus = (typeof ORDER_PAYMENT_STATUSES)[number];

export const ORDER_FULFILLMENT_STATUSES = [
  'none',
  'in_progress',
  'delivered',
  'completed',
  'cancelled',
] as const;
export type OrderFulfillmentStatus = (typeof ORDER_FULFILLMENT_STATUSES)[number];

export type MarketplaceCurrency = 'EUR';

export interface SellerProfile {
  id: string;
  userId: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  categories: string[];
  status: SellerProfileStatus;
  payoutAccountId?: string | null;
  payoutProvider?: PayoutProvider | null;
  ratingAvg: number;
  salesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Offering {
  id: string;
  sellerId: string;
  type: OfferingType;
  title: string;
  slug: string;
  description: string;
  category: string;
  coverImageUrl?: string | null;
  gallery: string[];
  status: OfferingStatus;
  rejectionReason?: string | null;
  price?: number | null;
  currency: MarketplaceCurrency;
  deliveryDays?: number | null;
  deliverables: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DigitalAsset {
  id: string;
  offeringId: string;
  fileKey: string;
  fileName: string;
  sizeBytes: number;
  version: number;
  licenseTerms: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicSellerCard {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  ratingAvg: number;
  salesCount: number;
}

export interface PublicOfferingCard {
  id: string;
  slug: string;
  type: OfferingType;
  title: string;
  description: string;
  category: string;
  coverImageUrl?: string | null;
  price?: number | null;
  currency: MarketplaceCurrency;
  deliveryDays?: number | null;
  seller: PublicSellerCard;
  createdAt: string;
}

export interface PublicOfferingDetail extends PublicOfferingCard {
  gallery: string[];
  deliverables: string[];
  rejectionReason?: string | null;
  assets?: Array<Pick<DigitalAsset, 'fileName' | 'sizeBytes' | 'version' | 'licenseTerms'>>;
}

export interface ServiceRequest {
  id: string;
  buyerId: string;
  offeringId: string;
  sellerId: string;
  description: string;
  budgetEstimate?: number | null;
  attachments: string[];
  status: ServiceRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  id: string;
  requestId: string;
  sellerId: string;
  price: number;
  currency: MarketplaceCurrency;
  scope: string;
  deliveryDays: number;
  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  offeringId: string;
  type: OfferingType;
  amount: number;
  commissionAmount: number;
  sellerAmount: number;
  currency: MarketplaceCurrency;
  paymentStatus: OrderPaymentStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  paymentProvider?: PayoutProvider | null;
  paymentIntentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  offeringId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceSettings {
  commissionPercent: number;
  updatedBy?: string | null;
  updatedAt: string;
}

export interface ApplySellerRequest {
  displayName: string;
  bio?: string | null;
  categories: string[];
}

export interface SellerProfileResponse {
  seller: SellerProfile;
}

export interface ListAdminSellersResponse {
  items: SellerProfile[];
}

export interface MarketplaceSettingsResponse {
  settings: MarketplaceSettings;
}

export interface UpdateCommissionRequest {
  commissionPercent: number;
}

export interface CreateSellerOfferingRequest {
  type: OfferingType;
  title: string;
  description: string;
  category: string;
  coverImageUrl?: string | null;
  gallery?: string[];
  price?: number | null;
  currency?: MarketplaceCurrency;
  deliveryDays?: number | null;
  deliverables?: string[];
}

export type CreateSellerOfferingResponse = { offering: Offering };

export type UpdateSellerOfferingRequest = Partial<
  Omit<CreateSellerOfferingRequest, 'type'>
>;

export type UpdateSellerOfferingResponse = { offering: Offering };

export interface ListSellerOfferingsQuery {
  page?: number;
  limit?: number;
}

export interface ListSellerOfferingsResponse {
  items: Offering[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type SubmitSellerOfferingResponse = { offering: Offering };

export interface CreateOfferingUploadUrlRequest {
  filename: string;
  contentType: string;
  sizeBytes: number;
}

export interface CreateOfferingUploadUrlResponse {
  uploadUrl: string;
  fileKey: string;
}

export interface CreateDigitalAssetRequest {
  fileKey: string;
  fileName: string;
  sizeBytes: number;
  licenseTerms: string;
}

export type CreateDigitalAssetResponse = { asset: DigitalAsset };

export interface ListAdminOfferingsQuery {
  status?: OfferingStatus;
  page?: number;
  limit?: number;
}

export interface ListAdminOfferingsResponse {
  items: Offering[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type ApproveOfferingResponse = { offering: Offering };

export interface RejectOfferingRequest {
  reason?: string | null;
}

export type RejectOfferingResponse = { offering: Offering };

export interface ListPublicOfferingsQuery {
  q?: string;
  type?: OfferingType;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'relevance' | 'popular' | 'new' | 'rating';
  page?: number;
  limit?: number;
}

export interface ListPublicOfferingsResponse {
  items: PublicOfferingCard[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type GetPublicOfferingBySlugResponse = { offering: PublicOfferingDetail };

export type GetPublicSellerByIdResponse = {
  seller: PublicSellerCard & {
    bio?: string | null;
    categories: string[];
  };
  offerings: PublicOfferingCard[];
};

export interface SellerConnectResponse {
  onboardingUrl: string;
}

export interface SellerConnectStatusResponse {
  payoutProvider: PayoutProvider | null;
  payoutAccountId: string | null;
  chargesEnabled: boolean;
}

export interface CreateCheckoutRequest {
  offeringId: string;
}

export interface CreateCheckoutResponse {
  clientSecret: string;
  order: Order;
}

export interface ListMyOrdersQuery {
  page?: number;
  limit?: number;
}

export interface ListMyOrdersResponse {
  items: Order[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type DeliverOrderResponse = { order: Order };

export type CompleteOrderResponse = { order: Order };

export interface DownloadOrderResponse {
  downloadUrl: string;
  expiresInSeconds: number;
}
