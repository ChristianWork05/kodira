import { BadRequestException, NotFoundException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { Model } from 'mongoose';
import type {
  GetPublicOfferingBySlugResponse,
  GetPublicSellerByIdResponse,
  ListPublicOfferingsQuery,
  ListPublicOfferingsResponse,
  PublicOfferingCard,
  PublicOfferingDetail,
  PublicSellerCard,
} from '@kodira/types';
import { SellerProfile } from './schemas/seller-profile.schema';
import type { SellerProfileDocument } from './schemas/seller-profile.schema';
import { Offering as OfferingModel } from './schemas/offering.schema';
import type { OfferingDocument } from './schemas/offering.schema';
import { DigitalAsset as DigitalAssetModel } from './schemas/digital-asset.schema';
import type { DigitalAssetDocument } from './schemas/digital-asset.schema';

@Injectable()
export class MarketplacePublicService {
  constructor(
    @InjectModel(SellerProfile.name)
    private readonly sellers: Model<SellerProfileDocument>,
    @InjectModel(OfferingModel.name)
    private readonly offerings: Model<OfferingDocument>,
    @InjectModel(DigitalAssetModel.name)
    private readonly assets: Model<DigitalAssetDocument>,
  ) {}

  async listPublicOfferings(
    query: ListPublicOfferingsQuery,
  ): Promise<ListPublicOfferingsResponse> {
    const limit = typeof query.limit === 'number' ? query.limit : 20;
    const page = typeof query.page === 'number' ? query.page : 1;
    const safeLimit = Math.max(1, Math.min(50, limit));
    const safePage = Math.max(1, page);
    const skip = (safePage - 1) * safeLimit;

    const match: Record<string, unknown> = { status: 'published' };
    if (typeof query.type === 'string') match.type = query.type;
    if (typeof query.category === 'string') match.category = query.category;
    if (typeof query.q === 'string' && query.q.trim().length > 0) {
      match.$text = { $search: query.q.trim() };
    }
    if (typeof query.minPrice === 'number' || typeof query.maxPrice === 'number') {
      const priceMatch: Record<string, unknown> = { $ne: null };
      if (typeof query.minPrice === 'number') priceMatch.$gte = query.minPrice;
      if (typeof query.maxPrice === 'number') priceMatch.$lte = query.maxPrice;
      match.price = priceMatch;
    }

    const sortMode = query.sort ?? 'relevance';
    const hasSearch = typeof match.$text === 'object';
    const sort =
      sortMode === 'relevance' && hasSearch
        ? { score: -1, createdAt: -1 }
        : sortMode === 'rating'
          ? { 'seller.ratingAvg': -1, createdAt: -1 }
          : sortMode === 'popular'
            ? { 'seller.salesCount': -1, createdAt: -1 }
            : { createdAt: -1 };

    const sellersCollection = this.sellers.collection.name;
    const pipeline: any[] = [
      { $match: match },
      ...(hasSearch ? [{ $addFields: { score: { $meta: 'textScore' } } }] : []),
      {
        $lookup: {
          from: sellersCollection,
          localField: 'sellerId',
          foreignField: '_id',
          as: 'seller',
        },
      },
      { $unwind: '$seller' },
      { $match: { 'seller.status': 'approved' } },
      {
        $facet: {
          items: [
            { $sort: sort },
            { $skip: skip },
            { $limit: safeLimit },
            {
              $project: {
                _id: 1,
                slug: 1,
                type: 1,
                title: 1,
                description: 1,
                category: 1,
                coverImageUrl: 1,
                price: 1,
                currency: 1,
                deliveryDays: 1,
                createdAt: 1,
                seller: {
                  _id: '$seller._id',
                  displayName: '$seller.displayName',
                  avatarUrl: '$seller.avatarUrl',
                  ratingAvg: '$seller.ratingAvg',
                  salesCount: '$seller.salesCount',
                },
              },
            },
          ],
          meta: [{ $count: 'total' }],
        },
      },
    ];

    const result = await this.offerings.aggregate(pipeline);
    const first = result?.[0] ?? { items: [], meta: [] };
    const total = first.meta?.[0]?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    const items = (first.items ?? []).map((row: any): PublicOfferingCard => ({
      id: row._id.toString(),
      slug: row.slug,
      type: row.type,
      title: row.title,
      description: row.description,
      category: row.category,
      coverImageUrl: row.coverImageUrl ?? null,
      price: row.price ?? null,
      currency: row.currency,
      deliveryDays: row.deliveryDays ?? null,
      seller: {
        id: row.seller._id.toString(),
        displayName: row.seller.displayName,
        avatarUrl: row.seller.avatarUrl ?? null,
        ratingAvg: row.seller.ratingAvg ?? 0,
        salesCount: row.seller.salesCount ?? 0,
      },
      createdAt: new Date(row.createdAt).toISOString(),
    }));

    return { items, page: safePage, limit: safeLimit, total, totalPages };
  }

  async getPublicOfferingBySlug(
    slug: string,
  ): Promise<GetPublicOfferingBySlugResponse> {
    const safeSlug = (slug ?? '').trim();
    if (!safeSlug) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'slug is required',
      });
    }

    const sellersCollection = this.sellers.collection.name;
    const assetsCollection = this.assets.collection.name;
    const pipeline: any[] = [
      { $match: { slug: safeSlug, status: 'published' } },
      {
        $lookup: {
          from: sellersCollection,
          localField: 'sellerId',
          foreignField: '_id',
          as: 'seller',
        },
      },
      { $unwind: '$seller' },
      { $match: { 'seller.status': 'approved' } },
      {
        $lookup: {
          from: assetsCollection,
          let: { offeringId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$offeringId', '$$offeringId'] } } },
            { $sort: { version: -1 } },
            {
              $project: {
                _id: 0,
                fileName: 1,
                sizeBytes: 1,
                version: 1,
                licenseTerms: 1,
              },
            },
          ],
          as: 'assets',
        },
      },
      {
        $project: {
          _id: 1,
          slug: 1,
          type: 1,
          title: 1,
          description: 1,
          category: 1,
          coverImageUrl: 1,
          gallery: 1,
          price: 1,
          currency: 1,
          deliveryDays: 1,
          deliverables: 1,
          rejectionReason: 1,
          createdAt: 1,
          seller: {
            _id: '$seller._id',
            displayName: '$seller.displayName',
            avatarUrl: '$seller.avatarUrl',
            ratingAvg: '$seller.ratingAvg',
            salesCount: '$seller.salesCount',
          },
          assets: 1,
        },
      },
      { $limit: 1 },
    ];

    const result = await this.offerings.aggregate(pipeline);
    const row = result?.[0];
    if (!row) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Offering not found',
      });
    }

    const seller: PublicSellerCard = {
      id: row.seller._id.toString(),
      displayName: row.seller.displayName,
      avatarUrl: row.seller.avatarUrl ?? null,
      ratingAvg: row.seller.ratingAvg ?? 0,
      salesCount: row.seller.salesCount ?? 0,
    };

    const offering: PublicOfferingDetail = {
      id: row._id.toString(),
      slug: row.slug,
      type: row.type,
      title: row.title,
      description: row.description,
      category: row.category,
      coverImageUrl: row.coverImageUrl ?? null,
      price: row.price ?? null,
      currency: row.currency,
      deliveryDays: row.deliveryDays ?? null,
      seller,
      createdAt: new Date(row.createdAt).toISOString(),
      gallery: row.gallery ?? [],
      deliverables: row.deliverables ?? [],
      rejectionReason: row.rejectionReason ?? null,
      assets:
        row.type === 'digital_product'
          ? (row.assets ?? []).map((a: any) => ({
              fileName: a.fileName,
              sizeBytes: a.sizeBytes,
              version: a.version,
              licenseTerms: a.licenseTerms,
            }))
          : undefined,
    };

    return { offering };
  }

  async getPublicSellerById(
    sellerId: string,
  ): Promise<GetPublicSellerByIdResponse> {
    const sellerObjectId = this.parseObjectId(sellerId, 'id');
    const sellerDoc = await this.sellers.findOne({
      _id: sellerObjectId,
      status: 'approved',
    });
    if (!sellerDoc) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Seller not found',
      });
    }

    const seller: GetPublicSellerByIdResponse['seller'] = {
      id: sellerDoc._id.toString(),
      displayName: sellerDoc.displayName,
      avatarUrl: sellerDoc.avatarUrl ?? null,
      ratingAvg: sellerDoc.ratingAvg,
      salesCount: sellerDoc.salesCount,
      bio: sellerDoc.bio ?? null,
      categories: sellerDoc.categories ?? [],
    };

    const offeringDocs = await this.offerings
      .find({ sellerId: sellerDoc._id, status: 'published' })
      .sort({ createdAt: -1 });

    const offerings = offeringDocs.map(
      (o): PublicOfferingCard => ({
        id: o._id.toString(),
        slug: o.slug,
        type: o.type,
        title: o.title,
        description: o.description,
        category: o.category,
        coverImageUrl: o.coverImageUrl ?? null,
        price: o.price ?? null,
        currency: o.currency,
        deliveryDays: o.deliveryDays ?? null,
        seller: {
          id: seller.id,
          displayName: seller.displayName,
          avatarUrl: seller.avatarUrl ?? null,
          ratingAvg: seller.ratingAvg,
          salesCount: seller.salesCount,
        },
        createdAt: o.createdAt.toISOString(),
      }),
    );

    return { seller, offerings };
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
}
