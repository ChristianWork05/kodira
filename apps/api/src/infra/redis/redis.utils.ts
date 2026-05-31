import type { RedisOptions } from 'ioredis';

export function parseRedisUrl(redisUrl: string): RedisOptions {
  const url = new URL(redisUrl);

  const dbFromPath = url.pathname?.replace('/', '');
  const db =
    dbFromPath && dbFromPath.length > 0 && !Number.isNaN(Number(dbFromPath))
      ? Number(dbFromPath)
      : undefined;

  const port = url.port ? Number(url.port) : 6379;

  return {
    host: url.hostname,
    port,
    username: url.username || undefined,
    password: url.password || undefined,
    db,
    tls: url.protocol === 'rediss:' ? {} : undefined,
    connectTimeout: 2_000,
    maxRetriesPerRequest: 1,
  };
}
