import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { Model } from 'mongoose';
import Stripe from 'stripe';

type SInstance = Stripe.Stripe;
type SEvent = ReturnType<SInstance['webhooks']['constructEvent']>;
type SPaymentIntent = Extract<SEvent, { type: 'payment_intent.succeeded' }>['data']['object'];
type SAccount = Extract<SEvent, { type: 'account.updated' }>['data']['object'];
import type {
  CreateCheckoutResponse,
  DownloadOrderResponse,
  ListMyOrdersQuery,
  ListMyOrdersResponse,
  SellerConnectResponse,
  SellerConnectStatusResponse,
} from '@kodira/types';
import { DigitalAsset } from './schemas/digital-asset.schema';
import type { DigitalAssetDocument } from './schemas/digital-asset.schema';
import { Offering as OfferingModel } from './schemas/offering.schema';
import type { OfferingDocument } from './schemas/offering.schema';
import { Order } from './schemas/order.schema';
import type { OrderDocument } from './schemas/order.schema';
import { SellerProfile } from './schemas/seller-profile.schema';
import type { SellerProfileDocument } from './schemas/seller-profile.schema';
import { mapOrder } from './marketplace.mappers';
import { MarketplaceSettingsService } from './marketplace-settings.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class MarketplacePaymentsService {
  private stripe: Stripe.Stripe | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly settings: MarketplaceSettingsService,
    private readonly storage: StorageService,
    @InjectModel(SellerProfile.name)
    private readonly sellers: Model<SellerProfileDocument>,
    @InjectModel(OfferingModel.name)
    private readonly offerings: Model<OfferingDocument>,
    @InjectModel(Order.name)
    private readonly orders: Model<OrderDocument>,
    @InjectModel(DigitalAsset.name)
    private readonly assets: Model<DigitalAssetDocument>,
  ) {}

  async createConnectOnboardingLink(userId: string): Promise<SellerConnectResponse> {
    const seller = await this.getApprovedSellerByUserId(userId);
    if (seller.payoutProvider && seller.payoutProvider !== 'stripe') {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Seller already has a payout provider',
        details: { payoutProvider: seller.payoutProvider },
      });
    }

    const stripe = this.getStripe();
    let accountId = seller.payoutAccountId ?? null;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;
      seller.payoutProvider = 'stripe';
      seller.payoutAccountId = accountId;
      await seller.save();
    }

    const frontendUrl =
      (this.config.get<string>('FRONTEND_URL') ?? '').trim().replace(/\/+$/, '') ||
      'http://localhost:3000';
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      type: 'account_onboarding',
      refresh_url: `${frontendUrl}/studio?stripe=refresh`,
      return_url: `${frontendUrl}/studio?stripe=return`,
    });

    return { onboardingUrl: accountLink.url };
  }

  async getConnectStatus(userId: string): Promise<SellerConnectStatusResponse> {
    const seller = await this.getApprovedSellerByUserId(userId);
    if (!seller.payoutAccountId || seller.payoutProvider !== 'stripe') {
      return {
        payoutProvider: seller.payoutProvider ?? null,
        payoutAccountId: seller.payoutAccountId ?? null,
        chargesEnabled: false,
      };
    }

    const stripe = this.getStripe();
    const account = await stripe.accounts.retrieve(seller.payoutAccountId);
    const chargesEnabled = Boolean((account as any)?.charges_enabled);
    return {
      payoutProvider: seller.payoutProvider ?? null,
      payoutAccountId: seller.payoutAccountId ?? null,
      chargesEnabled,
    };
  }

  async createCheckout(params: {
    buyerUserId: string;
    offeringId: string;
  }): Promise<CreateCheckoutResponse> {
    const offeringId = this.parseObjectId(params.offeringId, 'offeringId');
    const offering = await this.offerings.findById(offeringId);
    if (!offering) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Offering not found',
      });
    }
    if (offering.status !== 'published') {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Offering is not published',
        details: { status: offering.status },
      });
    }
    if (offering.type !== 'digital_product' && offering.type !== 'fixed_package') {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Offering type is not purchasable',
        details: { type: offering.type },
      });
    }
    if (typeof offering.price !== 'number' || offering.price <= 0) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Offering price is invalid',
      });
    }

    const seller = await this.sellers.findById(offering.sellerId);
    if (!seller) {
      throw new InternalServerErrorException({
        code: 'INTERNAL_ERROR',
        message: 'Seller profile not found',
      });
    }
    if (seller.status !== 'approved') {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Seller is not approved',
        details: { status: seller.status },
      });
    }
    if (!seller.payoutAccountId || seller.payoutProvider !== 'stripe') {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Seller payout is not configured',
      });
    }

    const stripe = this.getStripe();
    const account = await stripe.accounts.retrieve(seller.payoutAccountId);
    const chargesEnabled = Boolean((account as any)?.charges_enabled);
    if (!chargesEnabled) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Seller payout is not ready',
      });
    }

    const settings = await this.settings.getSettings();
    const commissionPercent = settings.commissionPercent;

    const amount = offering.price;
    const commissionAmount = Math.round((amount * commissionPercent) / 100);
    const sellerAmount = amount - commissionAmount;

    if (commissionAmount < 0 || sellerAmount < 0) {
      throw new InternalServerErrorException({
        code: 'INTERNAL_ERROR',
        message: 'Invalid commission calculation',
        details: { amount, commissionPercent, commissionAmount, sellerAmount },
      });
    }

    const buyerObjectId = this.parseObjectId(params.buyerUserId, 'buyerUserId');

    const orderDoc = await this.orders.create({
      buyerId: buyerObjectId,
      sellerId: seller._id,
      offeringId: offering._id,
      type: offering.type,
      amount,
      commissionAmount,
      sellerAmount,
      currency: offering.currency ?? 'EUR',
      paymentStatus: 'pending',
      fulfillmentStatus: 'none',
      paymentProvider: 'stripe',
      paymentIntentId: null,
      transferId: null,
    });

    const currency = 'eur';
    const amountCents = this.toEurCents(amount);
    const commissionCents = this.toEurCents(commissionAmount);
    const sellerCents = this.toEurCents(sellerAmount);

    const metadata: Record<string, string> = {
      orderId: orderDoc._id.toString(),
      offeringId: offering._id.toString(),
      buyerId: params.buyerUserId,
      sellerId: seller._id.toString(),
      offeringType: offering.type,
      sellerAccountId: seller.payoutAccountId,
      commissionCents: String(commissionCents),
      sellerCents: String(sellerCents),
    };

    const paymentIntent =
      offering.type === 'digital_product'
        ? await stripe.paymentIntents.create({
            amount: amountCents,
            currency,
            automatic_payment_methods: { enabled: true },
            application_fee_amount: commissionCents,
            transfer_data: { destination: seller.payoutAccountId },
            metadata,
          })
        : await stripe.paymentIntents.create({
            amount: amountCents,
            currency,
            automatic_payment_methods: { enabled: true },
            metadata,
            transfer_group: `order_${orderDoc._id.toString()}`,
          });

    orderDoc.paymentIntentId = paymentIntent.id;
    await orderDoc.save();

    const clientSecret = paymentIntent.client_secret;
    if (!clientSecret) {
      throw new InternalServerErrorException({
        code: 'INTERNAL_ERROR',
        message: 'Stripe did not return a client secret',
      });
    }

    return { clientSecret, order: mapOrder(orderDoc) };
  }

  async listBuyerOrders(params: {
    buyerUserId: string;
    query: ListMyOrdersQuery;
  }): Promise<ListMyOrdersResponse> {
    const buyerId = this.parseObjectId(params.buyerUserId, 'buyerUserId');
    const limit = typeof params.query.limit === 'number' ? params.query.limit : 20;
    const page = typeof params.query.page === 'number' ? params.query.page : 1;
    const safeLimit = Math.max(1, Math.min(50, limit));
    const safePage = Math.max(1, page);
    const skip = (safePage - 1) * safeLimit;

    const filter = { buyerId };
    const [items, total] = await Promise.all([
      this.orders.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
      this.orders.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    return {
      items: items.map(mapOrder),
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
    };
  }

  async listSellerOrders(params: {
    sellerUserId: string;
    query: ListMyOrdersQuery;
  }): Promise<ListMyOrdersResponse> {
    const seller = await this.getApprovedSellerByUserId(params.sellerUserId);
    const limit = typeof params.query.limit === 'number' ? params.query.limit : 20;
    const page = typeof params.query.page === 'number' ? params.query.page : 1;
    const safeLimit = Math.max(1, Math.min(50, limit));
    const safePage = Math.max(1, page);
    const skip = (safePage - 1) * safeLimit;

    const filter = { sellerId: seller._id };
    const [items, total] = await Promise.all([
      this.orders.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
      this.orders.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    return {
      items: items.map(mapOrder),
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
    };
  }

  async deliverFixedPackage(params: { sellerUserId: string; orderId: string }) {
    const seller = await this.getApprovedSellerByUserId(params.sellerUserId);
    const orderId = this.parseObjectId(params.orderId, 'id');
    const order = await this.orders.findOne({ _id: orderId, sellerId: seller._id });
    if (!order) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Order not found',
      });
    }
    if (order.type !== 'fixed_package') {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Only fixed_package orders can be delivered',
      });
    }
    if (order.paymentStatus !== 'paid') {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Order is not paid',
        details: { paymentStatus: order.paymentStatus },
      });
    }
    if (order.fulfillmentStatus !== 'in_progress') {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Order cannot be delivered from current status',
        details: { fulfillmentStatus: order.fulfillmentStatus },
      });
    }
    order.fulfillmentStatus = 'delivered';
    await order.save();
    return mapOrder(order);
  }

  async completeFixedPackage(params: { buyerUserId: string; orderId: string }) {
    const buyerId = this.parseObjectId(params.buyerUserId, 'buyerUserId');
    const orderId = this.parseObjectId(params.orderId, 'id');
    const order = await this.orders.findOne({ _id: orderId, buyerId });
    if (!order) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Order not found',
      });
    }
    if (order.type !== 'fixed_package') {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Only fixed_package orders can be completed',
      });
    }
    if (order.paymentStatus !== 'paid') {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Order is not paid',
        details: { paymentStatus: order.paymentStatus },
      });
    }
    if (order.fulfillmentStatus !== 'delivered') {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Order cannot be completed from current status',
        details: { fulfillmentStatus: order.fulfillmentStatus },
      });
    }

    if (!order.paymentIntentId) {
      throw new InternalServerErrorException({
        code: 'INTERNAL_ERROR',
        message: 'Order is missing paymentIntentId',
      });
    }

    if (!order.transferId) {
      const seller = await this.sellers.findById(order.sellerId);
      if (!seller || seller.status !== 'approved') {
        throw new InternalServerErrorException({
          code: 'INTERNAL_ERROR',
          message: 'Seller profile not found',
        });
      }
      if (!seller.payoutAccountId || seller.payoutProvider !== 'stripe') {
        throw new InternalServerErrorException({
          code: 'INTERNAL_ERROR',
          message: 'Seller payout is not configured',
        });
      }

      const stripe = this.getStripe();
      const sellerCents = this.toEurCents(order.sellerAmount);
      const transfer = await stripe.transfers.create({
        amount: sellerCents,
        currency: 'eur',
        destination: seller.payoutAccountId,
        transfer_group: `order_${order._id.toString()}`,
        metadata: { orderId: order._id.toString() },
      });
      order.transferId = transfer.id;
      await seller.updateOne({ $inc: { salesCount: 1 } }).exec();
    }

    order.fulfillmentStatus = 'completed';
    await order.save();
    return mapOrder(order);
  }

  async downloadDigitalProduct(params: {
    buyerUserId: string;
    orderId: string;
  }): Promise<DownloadOrderResponse> {
    const buyerId = this.parseObjectId(params.buyerUserId, 'buyerUserId');
    const orderId = this.parseObjectId(params.orderId, 'id');

    const order = await this.orders.findOne({ _id: orderId, buyerId });
    if (!order) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Order not found',
      });
    }
    if (order.type !== 'digital_product') {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Only digital_product orders support download',
      });
    }
    if (order.paymentStatus !== 'paid') {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Order is not paid',
      });
    }

    const asset = await this.assets
      .findOne({ offeringId: order.offeringId })
      .sort({ version: -1 });
    if (!asset) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Asset not found',
      });
    }

    const expiresInSeconds = 600;
    const { downloadUrl } = await this.storage.createGetDownloadUrl({
      key: asset.fileKey,
      expiresInSeconds,
    });

    return { downloadUrl, expiresInSeconds };
  }

  async handleStripeWebhook(params: { rawBody: Buffer; signature: string | string[] | undefined }) {
    const stripe = this.getStripe();
    const webhookSecret = (this.config.get<string>('STRIPE_WEBHOOK_SECRET') ?? '').trim();
    if (!webhookSecret) {
      throw new InternalServerErrorException({
        code: 'INTERNAL_ERROR',
        message: 'Stripe webhook is not configured',
        details: { missing: ['STRIPE_WEBHOOK_SECRET'] },
      });
    }
    const sig = Array.isArray(params.signature) ? params.signature[0] : params.signature;
    if (!sig) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Missing Stripe signature header',
      });
    }

    let event: SEvent;
    try {
      event = stripe.webhooks.constructEvent(params.rawBody, sig, webhookSecret);
    } catch {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Invalid Stripe signature',
      });
    }

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as SPaymentIntent;
      await this.onPaymentIntentSucceeded(pi);
      return;
    }
    if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object as SPaymentIntent;
      await this.onPaymentIntentFailed(pi);
      return;
    }
    if (event.type === 'account.updated') {
      const account = event.data.object as SAccount;
      await this.onAccountUpdated(account);
      return;
    }
    return;
  }

  private async onPaymentIntentSucceeded(pi: SPaymentIntent) {
    const order = await this.orders.findOne({ paymentIntentId: pi.id });
    if (!order) return;
    if (order.paymentStatus === 'paid') return;

    order.paymentStatus = 'paid';
    order.paymentProvider = 'stripe';
    order.fulfillmentStatus =
      order.type === 'digital_product' ? 'completed' : 'in_progress';
    await order.save();
  }

  private async onPaymentIntentFailed(pi: SPaymentIntent) {
    const order = await this.orders.findOne({ paymentIntentId: pi.id });
    if (!order) return;
    if (order.paymentStatus === 'paid') return;
    if (order.paymentStatus === 'failed') return;
    order.paymentStatus = 'failed';
    order.paymentProvider = 'stripe';
    await order.save();
  }

  private async onAccountUpdated(account: SAccount) {
    const accountId = (account as any)?.id as string | undefined;
    if (!accountId) return;
    const seller = await this.sellers.findOne({ payoutAccountId: accountId, payoutProvider: 'stripe' });
    if (!seller) return;
    if (!seller.payoutAccountId) {
      seller.payoutAccountId = accountId;
      seller.payoutProvider = 'stripe';
      await seller.save();
    }
  }

  private getStripe(): Stripe.Stripe {
    if (this.stripe) return this.stripe;
    const secretKey = (this.config.get<string>('STRIPE_SECRET_KEY') ?? '').trim();
    if (!secretKey) {
      throw new InternalServerErrorException({
        code: 'INTERNAL_ERROR',
        message: 'Stripe is not configured',
        details: { missing: ['STRIPE_SECRET_KEY'] },
      });
    }
    this.stripe = new Stripe(secretKey);
    return this.stripe;
  }

  private async getApprovedSellerByUserId(userId: string): Promise<SellerProfileDocument> {
    const userObjectId = this.parseObjectId(userId, 'userId');
    const seller = await this.sellers.findOne({ userId: userObjectId });
    if (!seller) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Seller profile not found',
      });
    }
    if (seller.status !== 'approved') {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Seller is not approved',
        details: { status: seller.status },
      });
    }
    return seller;
  }

  private parseObjectId(value: string, field: string): Types.ObjectId {
    try {
      return new Types.ObjectId(value);
    } catch {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: `${field} must be a valid ObjectId`,
        details: { field },
      });
    }
  }

  private toEurCents(amountEur: number): number {
    return Math.round(amountEur * 100);
  }
}
