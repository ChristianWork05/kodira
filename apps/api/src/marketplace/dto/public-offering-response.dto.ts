import { ApiProperty } from '@nestjs/swagger';
import type { GetPublicOfferingBySlugResponse } from '@kodira/types';
import { PublicOfferingDetailDto } from './public-offering-detail.dto';

export class PublicOfferingResponseDto implements GetPublicOfferingBySlugResponse {
  @ApiProperty({ type: PublicOfferingDetailDto })
  offering!: PublicOfferingDetailDto;
}

