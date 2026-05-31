import { Inject, Injectable, Optional } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type {
  HealthDependencyStatus,
  HealthResponse,
  HealthStatus,
} from '@kodira/types';
import type { Connection } from 'mongoose';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../infra/redis/redis.constants';

@Injectable()
export class HealthService {
  constructor(
    @Optional()
    @InjectConnection()
    private readonly mongooseConnection?: Connection,
    @Optional() @Inject(REDIS_CLIENT) private readonly redis?: Redis | null,
  ) {}

  async check(): Promise<HealthResponse> {
    const db = this.getDbStatus();
    const redis = await this.getRedisStatus();

    const status: HealthStatus =
      db === 'up' && redis === 'up' ? 'ok' : 'degraded';
    return { status, db, redis };
  }

  private getDbStatus(): HealthDependencyStatus {
    if (!this.mongooseConnection) return 'down';
    return this.mongooseConnection.readyState === 1 ? 'up' : 'down';
  }

  private async getRedisStatus(): Promise<HealthDependencyStatus> {
    if (!this.redis) return 'down';

    try {
      const res = await this.redis.ping();
      return res === 'PONG' ? 'up' : 'down';
    } catch {
      return 'down';
    }
  }
}
