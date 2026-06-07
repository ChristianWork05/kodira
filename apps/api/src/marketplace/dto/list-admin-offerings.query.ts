import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import type { ListAdminOfferingsQuery, OfferingStatus } from '@kodira/types';
import { OFFERING_STATUSES } from '@kodira/types';

export class ListAdminOfferingsQueryDto implements ListAdminOfferingsQuery {
  @ApiPropertyOptional({ enum: OFFERING_STATUSES, default: 'pending' })
  @IsOptional()
  @IsIn(OFFERING_STATUSES)
  status?: OfferingStatus;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
