import { ApiProperty } from '@nestjs/swagger';
import type { ListMyOrdersResponse } from '@kodira/types';
import { OrderDto } from './order.dto';

export class ListMyOrdersResponseDto implements ListMyOrdersResponse {
  @ApiProperty({ type: [OrderDto] })
  items!: OrderDto[];

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;
}
