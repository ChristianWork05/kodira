import { ApiProperty } from '@nestjs/swagger';
import type { ListAdminOfferingsResponse, ListSellerOfferingsResponse } from '@kodira/types';
import { OfferingDto } from './offering.dto';

export class ListOfferingsResponseDto
  implements ListSellerOfferingsResponse, ListAdminOfferingsResponse
{
  @ApiProperty({ type: [OfferingDto] })
  items!: OfferingDto[];

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;
}

