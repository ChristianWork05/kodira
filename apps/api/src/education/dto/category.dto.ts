import { ApiProperty } from '@nestjs/swagger';
import type { Category } from '@kodira/types';

export class CategoryDto implements Category {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ nullable: true })
  icon?: string | null;

  @ApiProperty({ example: 0 })
  order!: number;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

