import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';
import { parseRedisUrl } from './redis.utils';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: async (config: ConfigService): Promise<Redis> => {
        const redisUrl = config.get<string>('REDIS_URL');
        if (!redisUrl) throw new Error('REDIS_URL is required');

        const client = new Redis(parseRedisUrl(redisUrl));
        client.on('error', () => undefined);

        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
