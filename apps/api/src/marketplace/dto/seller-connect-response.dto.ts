import { ApiProperty } from '@nestjs/swagger';
import type { SellerConnectResponse } from '@kodira/types';

export class SellerConnectResponseDto implements SellerConnectResponse {
  @ApiProperty()
  onboardingUrl!: string;
}
