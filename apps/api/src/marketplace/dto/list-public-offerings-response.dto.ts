import { ApiProperty } from '@nestjs/swagger';
import type { ListPublicOfferingsResponse } from '@kodira/types';
import { PublicOfferingCardDto } from './public-offering-card.dto';

export class ListPublicOfferingsResponseDto implements ListPublicOfferingsResponse {
  @ApiProperty({ type: [PublicOfferingCardDto] })
  items!: PublicOfferingCardDto[];

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;
}

