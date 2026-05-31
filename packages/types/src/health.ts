export type HealthStatus = 'ok' | 'degraded';
export type HealthDependencyStatus = 'up' | 'down';

export interface HealthResponse {
  status: HealthStatus;
  db: HealthDependencyStatus;
  redis: HealthDependencyStatus;
}
