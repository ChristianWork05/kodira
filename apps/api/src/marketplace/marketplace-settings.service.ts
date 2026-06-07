import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { Model } from 'mongoose';
import type { MarketplaceSettings as MarketplaceSettingsType } from '@kodira/types';
import { MarketplaceSettings } from './schemas/marketplace-settings.schema';
import type { MarketplaceSettingsDocument } from './schemas/marketplace-settings.schema';
import { mapMarketplaceSettings } from './marketplace.mappers';

@Injectable()
export class MarketplaceSettingsService {
  constructor(
    @InjectModel(MarketplaceSettings.name)
    private readonly settingsModel: Model<MarketplaceSettings>,
  ) {}

  async getSettings(): Promise<MarketplaceSettingsType> {
    const doc = await this.settingsModel
      .findOneAndUpdate(
        { singleton: 1 },
        { $setOnInsert: { singleton: 1, commissionPercent: 15, updatedBy: null } },
        { new: true, upsert: true },
      )
      .exec();

    return mapMarketplaceSettings(doc as MarketplaceSettingsDocument);
  }

  async setCommission(commissionPercent: number, adminUserId: string) {
    const adminObjectId = new Types.ObjectId(adminUserId);
    const doc = await this.settingsModel
      .findOneAndUpdate(
        { singleton: 1 },
        {
          $setOnInsert: { singleton: 1 },
          $set: { commissionPercent, updatedBy: adminObjectId },
        },
        { new: true, upsert: true },
      )
      .exec();

    return mapMarketplaceSettings(doc as MarketplaceSettingsDocument);
  }
}

