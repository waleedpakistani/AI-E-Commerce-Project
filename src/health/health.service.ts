import { Injectable, Inject, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DRIZZLE } from '../db/database.types';
import { RedisService } from '../common/redis/redis.service';

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  environment: string;
  database: {
    status: 'connected' | 'disconnected';
    message?: string;
  };
  redis: {
    status: 'connected' | 'disconnected';
    message?: string;
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: any,
    private readonly redisService: RedisService,
  ) {}

  async checkHealth(): Promise<HealthCheckResponse> {
    let dbStatus: 'connected' | 'disconnected' = 'disconnected';
    let dbMessage: string | undefined;

    try {
      await this.db.execute(sql`SELECT 1`);
      dbStatus = 'connected';
    } catch (error) {
      this.logger.error('Database health check failed', error);
      dbStatus = 'disconnected';
      dbMessage =
        error instanceof Error ? error.message : 'Database connection error';
    }

    let redisStatus: 'connected' | 'disconnected' = 'disconnected';
    let redisMessage: string | undefined;

    try {
      const reachable = await this.redisService.ping();
      redisStatus = reachable ? 'connected' : 'disconnected';
    } catch (error) {
      this.logger.error('Redis health check failed', error);
      redisStatus = 'disconnected';
      redisMessage =
        error instanceof Error ? error.message : 'Redis connection error';
    }

    const isHealthy =
      dbStatus === 'connected' && redisStatus === 'connected';

    return {
      status: isHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus,
        ...(dbMessage && { message: dbMessage }),
      },
      redis: {
        status: redisStatus,
        ...(redisMessage && { message: redisMessage }),
      },
    };
  }
}
