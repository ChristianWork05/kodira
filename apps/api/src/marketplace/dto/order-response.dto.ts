import { ApiProperty } from '@nestjs/swagger';
import type { CompleteOrderResponse, DeliverOrderResponse } from '@kodira/types';
import { OrderDto } from './order.dto';

export class OrderResponseDto implements DeliverOrderResponse, CompleteOrderResponse {
  @ApiProperty({ type: OrderDto })
  order!: OrderDto;
}
