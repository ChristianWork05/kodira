import { ApiProperty } from '@nestjs/swagger';
import type { MarketplaceSettings } from '@kodira/types';

export class MarketplaceSettingsDto implements MarketplaceSettings {
  @ApiProperty({ default: 15 })
  commissionPercent!: number;

  @ApiProperty({ nullable: true, required: false })
  updatedBy?: string | null;

  @ApiProperty()
  updatedAt!: string;
}

