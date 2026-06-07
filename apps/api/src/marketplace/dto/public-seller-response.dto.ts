import { ApiProperty } from '@nestjs/swagger';
import type { GetPublicSellerByIdResponse } from '@kodira/types';
import { PublicOfferingCardDto } from './public-offering-card.dto';
import { PublicSellerCardDto } from './public-seller.dto';

class PublicSellerProfileDto extends PublicSellerCardDto {
  @ApiProperty({ nullable: true, required: false })
  bio?: string | null;

  @ApiProperty({ type: [String] })
  categories!: string[];
}

export class PublicSellerResponseDto implements GetPublicSellerByIdResponse {
  @ApiProperty({ type: PublicSellerProfileDto })
  seller!: PublicSellerProfileDto;

  @ApiProperty({ type: [PublicOfferingCardDto] })
  offerings!: PublicOfferingCardDto[];
}

