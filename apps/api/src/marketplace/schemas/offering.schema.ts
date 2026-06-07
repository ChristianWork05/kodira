import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument, Types as MongooseTypes } from 'mongoose';
import { Types } from 'mongoose';
import type {
  MarketplaceCurrency,
  OfferingStatus,
  OfferingType,
} from '@kodira/types';
import { OFFERING_STATUSES, OFFERING_TYPES } from '@kodira/types';

export type OfferingDocument = HydratedDocument<Offering>;

@Schema({ timestamps: true })
export class Offering {
  @Prop({ type: Types.ObjectId, ref: 'SellerProfile', required: true, index: true })
  sellerId!: MongooseTypes.ObjectId;

  @Prop({ type: String, enum: OFFERING_TYPES, required: true })
  type!: OfferingType;

  @Prop({ type: String, required: true, trim: true })
  title!: string;

  @Prop({ type: String, required: true, unique: true, index: true })
  slug!: string;

  @Prop({ type: String, required: true })
  description!: string;

  @Prop({ type: String, required: true })
  category!: string;

  @Prop({ type: String, default: null })
  coverImageUrl?: string | null;

  @Prop({ type: [String], default: [] })
  gallery!: string[];

  @Prop({ type: String, enum: OFFERING_STATUSES, default: 'draft' })
  status!: OfferingStatus;

  @Prop({ type: String, default: null })
  rejectionReason?: string | null;

  @Prop({ type: Number, default: null })
  price?: number | null;

  @Prop({ type: String, default: 'EUR' })
  currency!: MarketplaceCurrency;

  @Prop({ type: Number, default: null })
  deliveryDays?: number | null;

  @Prop({ type: [String], default: [] })
  deliverables!: string[];

  createdAt!: Date;
  updatedAt!: Date;
}

export const OfferingSchema = SchemaFactory.createForClass(Offering);

OfferingSchema.index({ slug: 1 }, { unique: true });
OfferingSchema.index({ sellerId: 1, status: 1 });
OfferingSchema.index({ title: 'text', description: 'text' });
