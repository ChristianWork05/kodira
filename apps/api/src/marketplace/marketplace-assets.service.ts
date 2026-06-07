import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { Model } from 'mongoose';
import type { CreateDigitalAssetRequest, DigitalAsset } from '@kodira/types';
import type {
  CreateOfferingUploadUrlRequest,
  CreateOfferingUploadUrlResponse,
} from '@kodira/types';
import * as crypto from 'node:crypto';
import * as path from 'node:path';
import { StorageService } from '../storage/storage.service';
import { SellerProfile } from './schemas/seller-profile.schema';
import type { SellerProfileDocument } from './schemas/seller-profile.schema';
import { Offering as OfferingModel } from './schemas/offering.schema';
import type { OfferingDocument } from './schemas/offering.schema';
import { DigitalAsset as DigitalAssetModel } from './schemas/digital-asset.schema';
import type { DigitalAssetDocument } from './schemas/digital-asset.schema';
import { mapDigitalAsset } from './marketplace.mappers';

const MAX_ASSET_BYTES = 2 * 1024 * 1024 * 1024;

@Injectable()
export class MarketplaceAssetsService {
  constructor(
    private readonly storage: StorageService,
    @InjectModel(SellerProfile.name)
    private readonly sellers: Model<SellerProfileDocument>,
    @InjectModel(OfferingModel.name)
    private readonly offerings: Model<OfferingDocument>,
    @InjectModel(DigitalAssetModel.name)
    private readonly assets: Model<DigitalAssetDocument>,
  ) {}

  async createUploadUrl(params: {
    userId: string;
    offeringId: string;
    input: CreateOfferingUploadUrlRequest;
  }): Promise<CreateOfferingUploadUrlResponse> {
    const seller = await this.getApprovedSellerByUserId(params.userId);
    const offering = await this.getOwnedOffering({
      sellerId: seller._id,
      offeringId: params.offeringId,
    });

    if (offering.type !== 'digital_product') {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Only digital_product offerings support digital assets',
        details: { reason: 'INVALID_OFFERING_TYPE', type: offering.type },
      });
    }
    if (
      offering.status !== 'draft' &&
      offering.status !== 'pending' &&
      offering.status !== 'rejected'
    ) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Cannot upload assets for current offering status',
        details: { status: offering.status },
      });
    }

    const filename = this.normalizeFilename(params.input.filename);
    if (!filename) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'filename is required',
        details: { reason: 'INVALID_FILENAME' },
      });
    }

    const contentType = (params.input.contentType ?? '').trim();
    if (!contentType) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'contentType is required',
        details: { reason: 'INVALID_CONTENT_TYPE' },
      });
    }

    if (
      typeof params.input.sizeBytes !== 'number' ||
      params.input.sizeBytes < 1 ||
      params.input.sizeBytes > MAX_ASSET_BYTES
    ) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'sizeBytes is invalid',
        details: { reason: 'INVALID_SIZE', maxBytes: MAX_ASSET_BYTES },
      });
    }

    const ext = path.extname(filename).replace('.', '').toLowerCase();
    const safeBase = path
      .basename(filename, path.extname(filename))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
    const safeName = safeBase.length > 0 ? safeBase : 'asset';
    const fileKey = `marketplace/offerings/${offering._id.toString()}/assets/${crypto.randomUUID()}-${safeName}${ext ? `.${ext}` : ''}`;

    const { uploadUrl } = await this.storage.createPutUploadUrl({
      key: fileKey,
      contentType,
      cacheControl: 'private, max-age=0, no-cache',
    });

    return { uploadUrl, fileKey };
  }

  async createAsset(params: {
    userId: string;
    offeringId: string;
    input: CreateDigitalAssetRequest;
  }): Promise<DigitalAsset> {
    const seller = await this.getApprovedSellerByUserId(params.userId);
    const offering = await this.getOwnedOffering({
      sellerId: seller._id,
      offeringId: params.offeringId,
    });

    if (offering.type !== 'digital_product') {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Only digital_product offerings support digital assets',
        details: { reason: 'INVALID_OFFERING_TYPE', type: offering.type },
      });
    }
    if (offering.status === 'published') {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Cannot modify assets for published offering',
        details: { status: offering.status },
      });
    }

    const prefix = `marketplace/offerings/${offering._id.toString()}/assets/`;
    const fileKey = (params.input.fileKey ?? '').trim().replace(/^\/+/, '');
    if (!fileKey.startsWith(prefix) || fileKey.includes('..')) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'fileKey is invalid for this offering',
        details: { reason: 'INVALID_FILE_KEY' },
      });
    }

    const fileName = this.normalizeFilename(params.input.fileName);
    if (!fileName) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'fileName is required',
        details: { reason: 'INVALID_FILENAME' },
      });
    }

    const sizeBytes = params.input.sizeBytes;
    if (typeof sizeBytes !== 'number' || sizeBytes < 1) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'sizeBytes is required',
        details: { reason: 'INVALID_SIZE' },
      });
    }

    const licenseTerms = (params.input.licenseTerms ?? '').trim();
    if (!licenseTerms) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'licenseTerms is required',
        details: { reason: 'MISSING_LICENSE_TERMS' },
      });
    }

    const latest = await this.assets
      .findOne({ offeringId: offering._id })
      .sort({ version: -1 });
    const version = typeof latest?.version === 'number' ? latest.version + 1 : 1;

    const doc = await this.assets.create({
      offeringId: offering._id,
      fileKey,
      fileName,
      sizeBytes,
      licenseTerms,
      version,
    });
    return mapDigitalAsset(doc);
  }

  private normalizeFilename(filename: string): string {
    const base = path.basename(filename ?? '').trim();
    const cleaned = base.replaceAll('\u0000', '').trim();
    if (!cleaned) return '';
    if (cleaned.includes('/') || cleaned.includes('\\')) return '';
    return cleaned;
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

  private async getOwnedOffering(params: {
    sellerId: Types.ObjectId;
    offeringId: string;
  }): Promise<OfferingDocument> {
    const offeringId = this.parseObjectId(params.offeringId, 'id');
    const offering = await this.offerings.findOne({
      _id: offeringId,
      sellerId: params.sellerId,
    });
    if (!offering) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Offering not found',
      });
    }
    return offering;
  }
}

