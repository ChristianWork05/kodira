import { ApiProperty } from '@nestjs/swagger';
import type { HealthDependencyStatus, HealthStatus } from '@kodira/types';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok', description: 'ok | degraded' })
  status!: HealthStatus;

  @ApiProperty({ example: 'up', description: 'up | down' })
  db!: HealthDependencyStatus;

  @ApiProperty({ example: 'up', description: 'up | down' })
  redis!: HealthDependencyStatus;
}
