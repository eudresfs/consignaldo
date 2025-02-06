import { SetMetadata } from '@nestjs/common';
import { RateLimitConfig } from './rate-limit.guard';

export const RateLimit = (config: RateLimitConfig) => SetMetadata('rateLimit', config);
