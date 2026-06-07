import { ApiProperty } from '@nestjs/swagger';
import type { PublicSellerCard } from '@kodira/types';

export class PublicSellerCardDto implements PublicSellerCard {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty({ nullable: true, required: false })
  avatarUrl?: string | null;

  @ApiProperty()
  ratingAvg!: number;

  @ApiProperty()
  salesCount!: number;
}

