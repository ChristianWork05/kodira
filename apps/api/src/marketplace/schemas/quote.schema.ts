import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument, Types as MongooseTypes } from 'mongoose';
import { Types } from 'mongoose';
import type { MarketplaceCurrency, QuoteStatus } from '@kodira/types';
import { QUOTE_STATUSES } from '@kodira/types';

export type QuoteDocument = HydratedDocument<Quote>;

@Schema({ timestamps: true })
export class Quote {
  @Prop({ type: Types.ObjectId, ref: 'ServiceRequest', required: true, index: true })
  requestId!: MongooseTypes.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SellerProfile', required: true, index: true })
  sellerId!: MongooseTypes.ObjectId;

  @Prop({ type: Number, required: true })
  price!: number;

  @Prop({ type: String, default: 'EUR' })
  currency!: MarketplaceCurrency;

  @Prop({ type: String, required: true })
  scope!: string;

  @Prop({ type: Number, required: true })
  deliveryDays!: number;

  @Prop({ type: String, enum: QUOTE_STATUSES, default: 'sent' })
  status!: QuoteStatus;

  createdAt!: Date;
  updatedAt!: Date;
}

export const QuoteSchema = SchemaFactory.createForClass(Quote);

QuoteSchema.index({ requestId: 1, sellerId: 1, createdAt: -1 });

