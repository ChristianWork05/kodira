import { ApiProperty } from '@nestjs/swagger';
import type { MarketplaceSettingsResponse } from '@kodira/types';
import { MarketplaceSettingsDto } from './marketplace-settings.dto';

export class MarketplaceSettingsResponseDto implements MarketplaceSettingsResponse {
  @ApiProperty({ type: MarketplaceSettingsDto })
  settings!: MarketplaceSettingsDto;
}

