import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';
import type { UpdateCommissionRequest } from '@kodira/types';

export class UpdateCommissionDto implements UpdateCommissionRequest {
  @ApiProperty({ example: 15, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionPercent!: number;
}

