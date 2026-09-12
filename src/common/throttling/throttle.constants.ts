export const THROTTLE_OPTIONS = 'THROTTLE_OPTIONS';

export interface ThrottleOptions {
  limit: number;
  ttl: number;
}

export const DEFAULT_THROTTLE: ThrottleOptions = {
  limit: 100,
  ttl: 60,
};