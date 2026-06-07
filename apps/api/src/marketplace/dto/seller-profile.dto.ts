import { ApiProperty } from '@nestjs/swagger';
import type { PayoutProvider, SellerProfile, SellerProfileStatus } from '@kodira/types';
import { PAYOUT_PROVIDERS, SELLER_PROFILE_STATUSES } from '@kodira/types';

export class SellerProfileDto implements SellerProfile {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty({ nullable: true, required: false })
  bio?: string | null;

  @ApiProperty({ nullable: true, required: false })
  avatarUrl?: string | null;

  @ApiProperty({ type: [String] })
  categories!: string[];

  @ApiProperty({ enum: SELLER_PROFILE_STATUSES, default: 'pending' })
  status!: SellerProfileStatus;

  @ApiProperty({ nullable: true, required: false })
  payoutAccountId?: string | null;

  @ApiProperty({ enum: PAYOUT_PROVIDERS, nullable: true, required: false })
  payoutProvider?: PayoutProvider | null;

  @ApiProperty({ default: 0 })
  ratingAvg!: number;

  @ApiProperty({ default: 0 })
  salesCount!: number;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

