import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import type { ListPublicOfferingsQuery, OfferingType } from '@kodira/types';
import { OFFERING_TYPES } from '@kodira/types';

const SORTS = ['relevance', 'popular', 'new', 'rating'] as const;

export class ListPublicOfferingsQueryDto implements ListPublicOfferingsQuery {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  q?: string;

  @ApiPropertyOptional({ enum: OFFERING_TYPES })
  @IsOptional()
  @IsIn(OFFERING_TYPES)
  type?: OfferingType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ enum: SORTS, default: 'relevance' })
  @IsOptional()
  @IsIn(SORTS as unknown as string[])
  sort?: ListPublicOfferingsQuery['sort'];

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
