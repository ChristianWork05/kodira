import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';
import type { ApplySellerRequest } from '@kodira/types';

export class ApplySellerDto implements ApplySellerRequest {
  @ApiProperty({ example: 'KODIRA Studio' })
  @IsString()
  @MinLength(2)
  displayName!: string;

  @ApiProperty({ required: false, nullable: true, example: 'Desarrollo web y mobile.' })
  @IsOptional()
  @IsString()
  bio?: string | null;

  @ApiProperty({ type: [String], example: ['web', 'mobile'] })
  @IsArray()
  @IsString({ each: true })
  categories!: string[];
}

