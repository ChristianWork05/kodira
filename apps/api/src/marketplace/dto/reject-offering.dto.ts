import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';
import type { RejectOfferingRequest } from '@kodira/types';

export class RejectOfferingDto implements RejectOfferingRequest {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  reason?: string | null;
}

