import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { Model } from 'mongoose';
import type { SellerProfileStatus } from '@kodira/types';
import type { ApplySellerDto } from './dto/apply-seller.dto';
import { SellerProfile } from './schemas/seller-profile.schema';
import type { SellerProfileDocument } from './schemas/seller-profile.schema';
import { mapSellerProfile } from './marketplace.mappers';
import { UsersService } from '../users/users.service';

@Injectable()
export class MarketplaceSellersService {
  constructor(
    @InjectModel(SellerProfile.name)
    private readonly sellerModel: Model<SellerProfile>,
    private readonly users: UsersService,
  ) {}

  async apply(userId: string, dto: ApplySellerDto) {
    const userObjectId = new Types.ObjectId(userId);

    const existing = await this.sellerModel
      .findOne({ userId: userObjectId })
      .exec();
    if (existing) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'Seller profile already exists',
      });
    }

    const created = await this.sellerModel.create({
      userId: userObjectId,
      displayName: dto.displayName,
      bio: dto.bio ?? null,
      categories: dto.categories ?? [],
      status: 'pending',
    });

    return mapSellerProfile(created as SellerProfileDocument);
  }

  async getByUserId(userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const seller = await this.sellerModel
      .findOne({ userId: userObjectId })
      .exec();
    if (!seller) throw new NotFoundException();
    return mapSellerProfile(seller as SellerProfileDocument);
  }

  async listByStatus(status: SellerProfileStatus) {
    const sellers = await this.sellerModel
      .find({ status })
      .sort({ createdAt: -1 })
      .exec();
    return sellers.map((s) => mapSellerProfile(s as SellerProfileDocument));
  }

  async approve(sellerProfileId: string, _adminUserId: string) {
    const sellerObjectId = new Types.ObjectId(sellerProfileId);
    const updated = await this.sellerModel
      .findByIdAndUpdate(
        sellerObjectId,
        { status: 'approved' },
        { new: true },
      )
      .exec();

    if (!updated) throw new NotFoundException();

    await this.users.addRole(updated.userId.toString(), 'seller');
    return mapSellerProfile(updated as SellerProfileDocument);
  }

  async reject(sellerProfileId: string, _adminUserId: string) {
    const sellerObjectId = new Types.ObjectId(sellerProfileId);
    const updated = await this.sellerModel
      .findByIdAndUpdate(
        sellerObjectId,
        { status: 'rejected' },
        { new: true },
      )
      .exec();
    if (!updated) throw new NotFoundException();
    return mapSellerProfile(updated as SellerProfileDocument);
  }
}
