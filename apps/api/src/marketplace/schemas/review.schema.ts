import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument, Types as MongooseTypes } from 'mongoose';
import { Types } from 'mongoose';

export type ReviewDocument = HydratedDocument<Review>;

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, unique: true, index: true })
  orderId!: MongooseTypes.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  buyerId!: MongooseTypes.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SellerProfile', required: true, index: true })
  sellerId!: MongooseTypes.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Offering', required: true, index: true })
  offeringId!: MongooseTypes.ObjectId;

  @Prop({ type: Number, required: true, min: 1, max: 5 })
  rating!: number;

  @Prop({ type: String, default: null })
  comment?: string | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.index({ sellerId: 1, createdAt: -1 });
ReviewSchema.index({ offeringId: 1, createdAt: -1 });

