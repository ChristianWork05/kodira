import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument, Types as MongooseTypes } from 'mongoose';
import { Types } from 'mongoose';

export type DigitalAssetDocument = HydratedDocument<DigitalAsset>;

@Schema({ timestamps: true })
export class DigitalAsset {
  @Prop({ type: Types.ObjectId, ref: 'Offering', required: true, index: true })
  offeringId!: MongooseTypes.ObjectId;

  @Prop({ type: String, required: true })
  fileKey!: string;

  @Prop({ type: String, required: true })
  fileName!: string;

  @Prop({ type: Number, required: true })
  sizeBytes!: number;

  @Prop({ type: Number, default: 1 })
  version!: number;

  @Prop({ type: String, required: true })
  licenseTerms!: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export const DigitalAssetSchema = SchemaFactory.createForClass(DigitalAsset);

DigitalAssetSchema.index({ offeringId: 1, version: -1 });

