import { ApiProperty } from '@nestjs/swagger';
import type { ListAdminSellersResponse } from '@kodira/types';
import { SellerProfileDto } from './seller-profile.dto';

export class ListAdminSellersResponseDto implements ListAdminSellersResponse {
  @ApiProperty({ type: [SellerProfileDto] })
  items!: SellerProfileDto[];
}

