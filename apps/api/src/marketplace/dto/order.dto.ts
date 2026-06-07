import { ApiProperty } from '@nestjs/swagger';
import type {
  MarketplaceCurrency,
  Order,
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

export class OrderDto implements Order {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  buyerId!: string;

  @ApiProperty()
  sellerId!: string;

  @ApiProperty()
  offeringId!: string;

  @ApiProperty({ enum: OFFERING_TYPES })
  type!: OfferingType;

  @ApiProperty()
  amount!: number;

  @ApiProperty()
  commissionAmount!: number;

  @ApiProperty()
  sellerAmount!: number;

  @ApiProperty({ example: 'EUR' })
  currency!: MarketplaceCurrency;

  @ApiProperty({ enum: ORDER_PAYMENT_STATUSES })
  paymentStatus!: OrderPaymentStatus;

  @ApiProperty({ enum: ORDER_FULFILLMENT_STATUSES })
  fulfillmentStatus!: OrderFulfillmentStatus;

  @ApiProperty({ enum: PAYOUT_PROVIDERS, nullable: true, required: false })
  paymentProvider?: PayoutProvider | null;

  @ApiProperty({ nullable: true, required: false })
  paymentIntentId?: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
