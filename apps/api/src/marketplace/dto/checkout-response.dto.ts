import { ApiProperty } from '@nestjs/swagger';
import type { CreateCheckoutResponse } from '@kodira/types';
import { OrderDto } from './order.dto';

export class CheckoutResponseDto implements CreateCheckoutResponse {
  @ApiProperty()
  clientSecret!: string;

  @ApiProperty({ type: OrderDto })
  order!: OrderDto;
}
