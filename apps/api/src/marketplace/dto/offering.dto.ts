import { ApiProperty } from '@nestjs/swagger';
import type {
  MarketplaceCurrency,
  Offering,
  OfferingStatus,
  OfferingType,
} from '@kodira/types';
import { OFFERING_STATUSES, OFFERING_TYPES } from '@kodira/types';

export class OfferingDto implements Offering {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  sellerId!: string;

  @ApiProperty({ enum: OFFERING_TYPES })
  type!: OfferingType;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  category!: string;

  @ApiProperty({ nullable: true, required: false })
  coverImageUrl?: string | null;

  @ApiProperty({ type: [String] })
  gallery!: string[];

  @ApiProperty({ enum: OFFERING_STATUSES })
  status!: OfferingStatus;

  @ApiProperty({ nullable: true, required: false })
  rejectionReason?: string | null;

  @ApiProperty({ nullable: true, required: false })
  price?: number | null;

  @ApiProperty({ default: 'EUR' })
  currency!: MarketplaceCurrency;

  @ApiProperty({ nullable: true, required: false })
  deliveryDays?: number | null;

  @ApiProperty({ type: [String] })
  deliverables!: string[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

