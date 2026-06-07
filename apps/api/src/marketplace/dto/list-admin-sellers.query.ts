import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import type { SellerProfileStatus } from '@kodira/types';
import { SELLER_PROFILE_STATUSES } from '@kodira/types';

export class ListAdminSellersQueryDto {
  @ApiPropertyOptional({ enum: SELLER_PROFILE_STATUSES, default: 'pending' })
  @IsOptional()
  @IsIn(SELLER_PROFILE_STATUSES)
  status?: SellerProfileStatus;
}

