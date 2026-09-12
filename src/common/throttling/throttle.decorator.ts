import { SetMetadata } from '@nestjs/common';
import { THROTTLE_OPTIONS, ThrottleOptions } from './throttle.constants';

export const Throttle = (options: ThrottleOptions) =>
  SetMetadata(THROTTLE_OPTIONS, options);