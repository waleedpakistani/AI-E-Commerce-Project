import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { RedisService } from '../redis/redis.service';
import {
  DEFAULT_THROTTLE,
  THROTTLE_OPTIONS,
  ThrottleOptions,
} from './throttle.constants';

@Injectable()
export class ThrottleGuard implements CanActivate {
  private readonly logger = new Logger(ThrottleGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const custom = this.reflector.getAllAndOverride<ThrottleOptions | undefined>(
      THROTTLE_OPTIONS,
      [context.getHandler(), context.getClass()],
    );
    const options = custom || DEFAULT_THROTTLE;

    const request = context.switchToHttp().getRequest<Request>();
    const ip =
      request.ip ||
      request.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      request.socket?.remoteAddress ||
      'unknown';
    const route =
      request.route?.path || `${request.method} ${request.originalUrl}`;

    const key = `rate-limit:${ip}:${request.method}:${route}`;

    try {
      const count = await this.redisService.increment(key, options.ttl);
      if (count > options.limit) {
        throw new HttpException(
          'Too many requests. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.warn('Rate limiter unavailable, allowing request');
      return true;
    }
  }
}