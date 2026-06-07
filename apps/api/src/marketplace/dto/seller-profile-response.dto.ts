import { ApiProperty } from '@nestjs/swagger';
import type { SellerProfileResponse } from '@kodira/types';
import { SellerProfileDto } from './seller-profile.dto';

export class SellerProfileResponseDto implements SellerProfileResponse {
  @ApiProperty({ type: SellerProfileDto })
  seller!: SellerProfileDto;
}

