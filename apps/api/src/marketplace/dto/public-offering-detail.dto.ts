import { ApiProperty } from '@nestjs/swagger';
import type { PublicOfferingDetail } from '@kodira/types';
import { PublicOfferingCardDto } from './public-offering-card.dto';

class PublicDigitalAssetMetaDto {
  @ApiProperty()
  fileName!: string;

  @ApiProperty()
  sizeBytes!: number;

  @ApiProperty()
  version!: number;

  @ApiProperty()
  licenseTerms!: string;
}

export class PublicOfferingDetailDto
  extends PublicOfferingCardDto
  implements PublicOfferingDetail
{
  @ApiProperty({ type: [String] })
  gallery!: string[];

  @ApiProperty({ type: [String] })
  deliverables!: string[];

  @ApiProperty({ nullable: true, required: false })
  rejectionReason?: string | null;

  @ApiProperty({
    required: false,
    type: [PublicDigitalAssetMetaDto],
    description: 'Digital products only. Never includes fileKey or download URL.',
  })
  assets?: Array<
    Pick<
      PublicDigitalAssetMetaDto,
      'fileName' | 'sizeBytes' | 'version' | 'licenseTerms'
    >
  >;
}
