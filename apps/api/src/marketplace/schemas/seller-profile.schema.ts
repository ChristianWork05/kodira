import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument, Types as MongooseTypes } from 'mongoose';
import { Types } from 'mongoose';
import type { PayoutProvider, SellerProfileStatus } from '@kodira/types';
import { PAYOUT_PROVIDERS, SELLER_PROFILE_STATUSES } from '@kodira/types';

export type SellerProfileDocument = HydratedDocument<SellerProfile>;

@Schema({ timestamps: true })
export class SellerProfile {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId!: MongooseTypes.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  displayName!: string;

  @Prop({ type: String, default: null })
  bio?: string | null;

  @Prop({ type: String, default: null })
  avatarUrl?: string | null;

  @Prop({ type: [String], default: [] })
  categories!: string[];

  @Prop({ type: String, enum: SELLER_PROFILE_STATUSES, default: 'pending' })
  status!: SellerProfileStatus;

  @Prop({ type: String, default: null })
  payoutAccountId?: string | null;

  @Prop({ type: String, enum: PAYOUT_PROVIDERS, default: null })
  payoutProvider?: PayoutProvider | null;

  @Prop({ type: Number, default: 0 })
  ratingAvg!: number;

  @Prop({ type: Number, default: 0 })
  salesCount!: number;

  createdAt!: Date;
  updatedAt!: Date;
}

export const SellerProfileSchema = SchemaFactory.createForClass(SellerProfile);

SellerProfileSchema.index({ userId: 1 }, { unique: true });

