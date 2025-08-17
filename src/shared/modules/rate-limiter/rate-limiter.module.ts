import { Module } from '@nestjs/common';
import { RateLimiterService } from '@shared/modules/rate-limiter/rate-limiter.service';

@Module({
  imports: [],
  providers: [RateLimiterService],
  exports: [RateLimiterService],
})
export class RateLimiterModule {}
