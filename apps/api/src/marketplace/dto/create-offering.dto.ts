import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import type { CreateSellerOfferingRequest, MarketplaceCurrency, OfferingType } from '@kodira/types';
import { OFFERING_TYPES } from '@kodira/types';

export class CreateOfferingDto implements CreateSellerOfferingRequest {
  @ApiProperty({ enum: OFFERING_TYPES })
  @IsIn(OFFERING_TYPES)
  type!: OfferingType;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  title!: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  description!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  category!: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  coverImageUrl?: string | null;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  gallery?: string[];

  @ApiProperty({ required: false, nullable: true, description: 'May be null for custom_service' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number | null;

  @ApiProperty({ required: false, default: 'EUR' })
  @IsOptional()
  @IsString()
  currency?: MarketplaceCurrency;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  deliveryDays?: number | null;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deliverables?: string[];
}

