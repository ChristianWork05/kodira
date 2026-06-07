import { ApiProperty } from '@nestjs/swagger';
import type { MarketplaceCurrency, OfferingType, PublicOfferingCard } from '@kodira/types';
import { OFFERING_TYPES } from '@kodira/types';
import { PublicSellerCardDto } from './public-seller.dto';

export class PublicOfferingCardDto implements PublicOfferingCard {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ enum: OFFERING_TYPES })
  type!: OfferingType;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  category!: string;

  @ApiProperty({ nullable: true, required: false })
  coverImageUrl?: string | null;

  @ApiProperty({ nullable: true, required: false })
  price?: number | null;

  @ApiProperty({ default: 'EUR' })
  currency!: MarketplaceCurrency;

  @ApiProperty({ nullable: true, required: false })
  deliveryDays?: number | null;

  @ApiProperty({ type: PublicSellerCardDto })
  seller!: PublicSellerCardDto;

  @ApiProperty()
  createdAt!: string;
}

