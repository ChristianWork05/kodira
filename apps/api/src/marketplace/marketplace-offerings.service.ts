import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { Model } from 'mongoose';
import type {
  CreateSellerOfferingRequest,
  ListAdminOfferingsQuery,
  ListAdminOfferingsResponse,
  ListSellerOfferingsQuery,
  ListSellerOfferingsResponse,
  Offering,
  OfferingStatus,
  RejectOfferingRequest,
  UpdateSellerOfferingRequest,
} from '@kodira/types';
import { SellerProfile } from './schemas/seller-profile.schema';
import type { SellerProfileDocument } from './schemas/seller-profile.schema';
import { Offering as OfferingModel } from './schemas/offering.schema';
import type { OfferingDocument } from './schemas/offering.schema';
import { DigitalAsset } from './schemas/digital-asset.schema';
import type { DigitalAssetDocument } from './schemas/digital-asset.schema';
import { mapOffering } from './marketplace.mappers';

@Injectable()
export class MarketplaceOfferingsService {
  constructor(
    @InjectModel(SellerProfile.name)
    private readonly sellers: Model<SellerProfileDocument>,
    @InjectModel(OfferingModel.name)
    private readonly offerings: Model<OfferingDocument>,
    @InjectModel(DigitalAsset.name)
    private readonly assets: Model<DigitalAssetDocument>,
  ) {}

  async createDraftOffering(
    userId: string,
    input: CreateSellerOfferingRequest,
  ): Promise<Offering> {
    const seller = await this.getApprovedSellerByUserId(userId);

    const baseSlug = this.slugify(input.title);
    const slug = await this.pickUniqueSlug({ baseSlug });

    const doc = await this.offerings.create({
      sellerId: seller._id,
      type: input.type,
      title: input.title,
      slug,
      description: input.description,
      category: input.category,
      coverImageUrl: input.coverImageUrl ?? null,
      gallery: input.gallery ?? [],
      status: 'draft',
      price: typeof input.price === 'number' ? input.price : null,
      currency: input.currency ?? 'EUR',
      deliveryDays:
        typeof input.deliveryDays === 'number' ? input.deliveryDays : null,
      deliverables: input.deliverables ?? [],
      rejectionReason: null,
    });

    return mapOffering(doc);
  }

  async updateOffering(params: {
    userId: string;
    offeringId: string;
    input: UpdateSellerOfferingRequest;
  }): Promise<Offering> {
    const seller = await this.getApprovedSellerByUserId(params.userId);
    const offeringId = this.parseObjectId(params.offeringId, 'id');

    const doc = await this.offerings.findOne({
      _id: offeringId,
      sellerId: seller._id,
    });
    if (!doc) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Offering not found',
      });
    }

    const input = params.input;

    if (typeof input.title === 'string' && input.title.trim().length > 0) {
      doc.title = input.title;
      const baseSlug = this.slugify(input.title);
      doc.slug = await this.pickUniqueSlug({
        baseSlug,
        excludeId: doc._id,
      });
    }
    if (typeof input.description === 'string') doc.description = input.description;
    if (typeof input.category === 'string') doc.category = input.category;

    if ('coverImageUrl' in input) {
      doc.coverImageUrl =
        typeof input.coverImageUrl === 'string' ? input.coverImageUrl : null;
    }
    if (Array.isArray(input.gallery)) doc.gallery = input.gallery;
    if ('price' in input) {
      doc.price = typeof input.price === 'number' ? input.price : null;
    }
    if (typeof input.currency === 'string') doc.currency = input.currency;
    if ('deliveryDays' in input) {
      doc.deliveryDays =
        typeof input.deliveryDays === 'number' ? input.deliveryDays : null;
    }
    if (Array.isArray(input.deliverables)) doc.deliverables = input.deliverables;

    await doc.save();
    return mapOffering(doc);
  }

  async listSellerOfferings(params: {
    userId: string;
    query: ListSellerOfferingsQuery;
  }): Promise<ListSellerOfferingsResponse> {
    const seller = await this.getApprovedSellerByUserId(params.userId);

    const limit =
      typeof params.query.limit === 'number' ? params.query.limit : 20;
    const page = typeof params.query.page === 'number' ? params.query.page : 1;
    const safeLimit = Math.max(1, Math.min(50, limit));
    const safePage = Math.max(1, page);
    const skip = (safePage - 1) * safeLimit;

    const filter = { sellerId: seller._id };
    const [items, total] = await Promise.all([
      this.offerings
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit),
      this.offerings.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    return {
      items: items.map(mapOffering),
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
    };
  }

  async submitOffering(params: {
    userId: string;
    offeringId: string;
  }): Promise<Offering> {
    const seller = await this.getApprovedSellerByUserId(params.userId);
    const offeringId = this.parseObjectId(params.offeringId, 'id');

    const doc = await this.offerings.findOne({
      _id: offeringId,
      sellerId: seller._id,
    });
    if (!doc) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Offering not found',
      });
    }

    if (doc.status !== 'draft' && doc.status !== 'rejected') {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Offering cannot be submitted from current status',
        details: { status: doc.status },
      });
    }

    await this.validateBeforeSubmit(doc);

    doc.status = 'pending';
    doc.rejectionReason = null;
    await doc.save();
    return mapOffering(doc);
  }

  async pauseOffering(params: { userId: string; offeringId: string }): Promise<Offering> {
    const seller = await this.getApprovedSellerByUserId(params.userId);
    const offeringId = this.parseObjectId(params.offeringId, 'id');
    const doc = await this.offerings.findOne({ _id: offeringId, sellerId: seller._id });
    if (!doc) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Offering not found' });
    }
    if (doc.status !== 'published') {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Only published offerings can be paused',
        details: { status: doc.status },
      });
    }
    doc.status = 'paused';
    await doc.save();
    return mapOffering(doc);
  }

  async unpauseOffering(params: {
    userId: string;
    offeringId: string;
  }): Promise<Offering> {
    const seller = await this.getApprovedSellerByUserId(params.userId);
    const offeringId = this.parseObjectId(params.offeringId, 'id');
    const doc = await this.offerings.findOne({ _id: offeringId, sellerId: seller._id });
    if (!doc) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Offering not found' });
    }
    if (doc.status !== 'paused') {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Only paused offerings can be unpaused',
        details: { status: doc.status },
      });
    }
    doc.status = 'published';
    await doc.save();
    return mapOffering(doc);
  }

  async listAdminOfferings(
    query: ListAdminOfferingsQuery,
  ): Promise<ListAdminOfferingsResponse> {
    const limit = typeof query.limit === 'number' ? query.limit : 20;
    const page = typeof query.page === 'number' ? query.page : 1;
    const safeLimit = Math.max(1, Math.min(50, limit));
    const safePage = Math.max(1, page);
    const skip = (safePage - 1) * safeLimit;

    const status: OfferingStatus | undefined =
      typeof query.status === 'string' ? query.status : undefined;
    const filter = status ? { status } : {};

    const [items, total] = await Promise.all([
      this.offerings
        .find(filter)
        .sort({ createdAt: status === 'pending' ? 1 : -1 })
        .skip(skip)
        .limit(safeLimit),
      this.offerings.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    return {
      items: items.map(mapOffering),
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
    };
  }

  async approveOffering(params: { offeringId: string }): Promise<Offering> {
    const offeringId = this.parseObjectId(params.offeringId, 'id');
    const doc = await this.offerings.findById(offeringId);
    if (!doc) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Offering not found',
      });
    }
    if (doc.status !== 'pending') {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Only pending offerings can be approved',
        details: { status: doc.status },
      });
    }
    doc.status = 'published';
    doc.rejectionReason = null;
    await doc.save();
    return mapOffering(doc);
  }

  async rejectOffering(params: {
    offeringId: string;
    input: RejectOfferingRequest;
  }): Promise<Offering> {
    const offeringId = this.parseObjectId(params.offeringId, 'id');
    const doc = await this.offerings.findById(offeringId);
    if (!doc) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Offering not found',
      });
    }
    if (doc.status !== 'pending') {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Only pending offerings can be rejected',
        details: { status: doc.status },
      });
    }
    doc.status = 'rejected';
    doc.rejectionReason =
      typeof params.input.reason === 'string' ? params.input.reason : null;
    await doc.save();
    return mapOffering(doc);
  }

  private async validateBeforeSubmit(offering: OfferingDocument): Promise<void> {
    if (offering.type === 'digital_product') {
      if (typeof offering.price !== 'number') {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Digital products require price before submit',
          details: { reason: 'MISSING_PRICE' },
        });
      }
      const count = await this.assets.countDocuments({ offeringId: offering._id });
      if (count < 1) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Digital products require at least one asset before submit',
          details: { reason: 'MISSING_ASSET' },
        });
      }
      return;
    }

    if (offering.type === 'fixed_package') {
      if (typeof offering.price !== 'number') {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Fixed packages require price before submit',
          details: { reason: 'MISSING_PRICE' },
        });
      }
      if (!Array.isArray(offering.deliverables) || offering.deliverables.length < 1) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Fixed packages require deliverables before submit',
          details: { reason: 'MISSING_DELIVERABLES' },
        });
      }
      if (typeof offering.deliveryDays !== 'number') {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Fixed packages require deliveryDays before submit',
          details: { reason: 'MISSING_DELIVERY_DAYS' },
        });
      }
    }
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

  private slugify(value: string): string {
    const raw = (value ?? '').toString().trim().toLowerCase();
    const normalized = raw.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    const dashed = normalized
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-');
    return dashed.length > 0 ? dashed.slice(0, 80) : 'offering';
  }

  private async pickUniqueSlug(params: {
    baseSlug: string;
    excludeId?: Types.ObjectId;
  }): Promise<string> {
    const base = params.baseSlug.length > 0 ? params.baseSlug : 'offering';
    const exists = async (slug: string) => {
      const query: Record<string, unknown> = { slug };
      if (params.excludeId) query._id = { $ne: params.excludeId };
      return Boolean(await this.offerings.exists(query));
    };

    if (!(await exists(base))) return base;
    for (let i = 2; i < 200; i += 1) {
      const candidate = `${base}-${i}`;
      if (!(await exists(candidate))) return candidate;
    }
    return `${base}-${Date.now()}`;
  }
}

