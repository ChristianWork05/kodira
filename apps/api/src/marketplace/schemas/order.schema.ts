import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument, Types as MongooseTypes } from 'mongoose';
import { Types } from 'mongoose';
import type {
  MarketplaceCurrency,
  OrderFulfillmentStatus,
  OrderPaymentStatus,
  OfferingType,
  PayoutProvider,
} from '@kodira/types';
import {
  OFFERING_TYPES,
  ORDER_FULFILLMENT_STATUSES,
  ORDER_PAYMENT_STATUSES,
  PAYOUT_PROVIDERS,
} from '@kodira/types';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  buyerId!: MongooseTypes.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SellerProfile', required: true, index: true })
  sellerId!: MongooseTypes.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Offering', required: true, index: true })
  offeringId!: MongooseTypes.ObjectId;

  @Prop({ type: String, enum: OFFERING_TYPES, required: true })
  type!: OfferingType;

  @Prop({ type: Number, required: true })
  amount!: number;

  @Prop({ type: Number, required: true })
  commissionAmount!: number;

  @Prop({ type: Number, required: true })
  sellerAmount!: number;

  @Prop({ type: String, default: 'EUR' })
  currency!: MarketplaceCurrency;

  @Prop({ type: String, enum: ORDER_PAYMENT_STATUSES, default: 'pending' })
  paymentStatus!: OrderPaymentStatus;

  @Prop({ type: String, enum: ORDER_FULFILLMENT_STATUSES, default: 'none' })
  fulfillmentStatus!: OrderFulfillmentStatus;

  @Prop({ type: String, enum: PAYOUT_PROVIDERS, default: null })
  paymentProvider?: PayoutProvider | null;

  @Prop({ type: String, default: null })
  paymentIntentId?: string | null;

  @Prop({ type: String, default: null })
  transferId?: string | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ buyerId: 1, createdAt: -1 });
OrderSchema.index({ sellerId: 1, createdAt: -1 });
OrderSchema.index({ paymentStatus: 1, createdAt: -1 });
