import { ApiProperty } from '@nestjs/swagger';
import type { PayoutProvider, SellerConnectStatusResponse } from '@kodira/types';
import { PAYOUT_PROVIDERS } from '@kodira/types';

export class SellerConnectStatusResponseDto implements SellerConnectStatusResponse {
  @ApiProperty({ enum: PAYOUT_PROVIDERS, nullable: true })
  payoutProvider!: PayoutProvider | null;

  @ApiProperty({ nullable: true })
  payoutAccountId!: string | null;

  @ApiProperty()
  chargesEnabled!: boolean;
}
