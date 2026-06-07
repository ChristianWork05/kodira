import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument, Types as MongooseTypes } from 'mongoose';
import { Types } from 'mongoose';
import type { ServiceRequestStatus } from '@kodira/types';
import { SERVICE_REQUEST_STATUSES } from '@kodira/types';

export type ServiceRequestDocument = HydratedDocument<ServiceRequest>;

@Schema({ timestamps: true })
export class ServiceRequest {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  buyerId!: MongooseTypes.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Offering', required: true, index: true })
  offeringId!: MongooseTypes.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SellerProfile', required: true, index: true })
  sellerId!: MongooseTypes.ObjectId;

  @Prop({ type: String, required: true })
  description!: string;

  @Prop({ type: Number, default: null })
  budgetEstimate?: number | null;

  @Prop({ type: [String], default: [] })
  attachments!: string[];

  @Prop({ type: String, enum: SERVICE_REQUEST_STATUSES, default: 'open' })
  status!: ServiceRequestStatus;

  createdAt!: Date;
  updatedAt!: Date;
}

export const ServiceRequestSchema = SchemaFactory.createForClass(ServiceRequest);

ServiceRequestSchema.index({ sellerId: 1, status: 1, createdAt: -1 });
ServiceRequestSchema.index({ buyerId: 1, createdAt: -1 });

