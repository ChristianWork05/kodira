import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument, Types as MongooseTypes } from 'mongoose';
import { Types } from 'mongoose';

export type MarketplaceSettingsDocument = HydratedDocument<MarketplaceSettings>;

@Schema({ timestamps: true })
export class MarketplaceSettings {
  @Prop({ type: Number, default: 1, unique: true, immutable: true })
  singleton!: number;

  @Prop({ type: Number, default: 15 })
  commissionPercent!: number;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  updatedBy?: MongooseTypes.ObjectId | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const MarketplaceSettingsSchema = SchemaFactory.createForClass(MarketplaceSettings);

MarketplaceSettingsSchema.index({ singleton: 1 }, { unique: true });

