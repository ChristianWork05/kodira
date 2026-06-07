import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';
import type { CreateCheckoutRequest } from '@kodira/types';

export class CreateCheckoutDto implements CreateCheckoutRequest {
  @ApiProperty()
  @IsMongoId()
  offeringId!: string;
}
