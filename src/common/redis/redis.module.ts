import { Global, Module, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS } from './redis.constants';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('RedisModule');

        const client = new Redis({
          host:
            configService.get<string>('redis.host') ||
            process.env.REDIS_HOST ||
            'localhost',
          port:
            configService.get<number>('redis.port') ||
            parseInt(process.env.REDIS_PORT || '6379', 10),
          password:
            configService.get<string>('redis.password') ||
            process.env.REDIS_PASSWORD ||
            undefined,
          db:
            configService.get<number>('redis.db') ||
            parseInt(process.env.REDIS_DB || '0', 10),
          lazyConnect: false,
          maxRetriesPerRequest: 3,
          retryStrategy: (times: number) => Math.min(times * 200, 2000),
        });

        client.on('ready', () => {
          logger.log('Redis connection established');
        });

        client.on('error', (error: Error) => {
          logger.warn(`Redis connection error: ${error.message}`);
        });

        return client;
      },
    },
    RedisService,
  ],
  exports: [REDIS, RedisService],
})
export class RedisModule {}