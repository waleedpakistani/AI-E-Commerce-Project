import { Injectable, Logger, Inject, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS } from './redis.constants';

export interface CacheRecord {
  value: unknown;
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject(REDIS) private readonly client: Redis) {}

  async onModuleDestroy() {
    await this.client.quit();
  }

  getClient(): Redis {
    return this.client;
  }

  async ping(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (error) {
      this.logger.warn(`Failed to read cache key ${key}`, error instanceof Error ? error.stack : error);
      return null;
    }
  }

  async setJson(
    key: string,
    value: unknown,
    ttlSeconds: number,
  ): Promise<void> {
    try {
      const raw = JSON.stringify(value);
      await this.client.set(key, raw, 'EX', ttlSeconds);
    } catch (error) {
      this.logger.warn(
        `Failed to write cache key ${key}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.warn(
        `Failed to delete cache key ${key}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }

  async deleteByPattern(pattern: string): Promise<void> {
    try {
      const stream = this.client.scanStream({ match: pattern, count: 100 });
      const keysToDelete: string[] = [];

      for await (const keys of stream) {
        if (keys.length > 0) {
          keysToDelete.push(...keys);
        }
      }

      if (keysToDelete.length > 0) {
        await this.client.del(...keysToDelete);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to delete cache keys matching ${pattern}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }

  async increment(key: string, ttlSeconds: number): Promise<number> {
    const count = await this.client.incr(key);
    if (count === 1) {
      await this.client.expire(key, ttlSeconds);
    }
    return count;
  }
}