import { ApiProperty } from '@nestjs/swagger';
import type {
  ApproveOfferingResponse,
  CreateSellerOfferingResponse,
  RejectOfferingResponse,
  SubmitSellerOfferingResponse,
  UpdateSellerOfferingResponse,
} from '@kodira/types';
import { OfferingDto } from './offering.dto';

export class OfferingResponseDto
  implements
    CreateSellerOfferingResponse,
    UpdateSellerOfferingResponse,
    SubmitSellerOfferingResponse,
    ApproveOfferingResponse,
    RejectOfferingResponse
{
  @ApiProperty({ type: OfferingDto })
  offering!: OfferingDto;
}

