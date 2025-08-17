import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Decorator to extract timezone from the 'x-timezone' header
 * Falls back to UTC if no timezone is provided or if the timezone is invalid
 *
 * @example
 * async getAnalytics(@Timezone() timezone: string) {
 *   // timezone will be 'America/New_York' if header is set, or 'UTC' as fallback
 * }
 */
export const Timezone = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<Request>();
  const timezone = request.headers['x-timezone'] as string;

  // Validate timezone if provided
  if (timezone) {
    try {
      // Test if the timezone is valid by creating a date formatter
      Intl.DateTimeFormat('en', { timeZone: timezone });
      return timezone;
    } catch {
      // Invalid timezone, fall back to UTC
      return 'UTC';
    }
  }

  // No timezone provided, default to UTC
  return 'UTC';
});

/**
 * Decorator to extract timezone from the 'x-timezone' header with custom fallback
 *
 * @param fallback - Custom fallback timezone (default: 'UTC')
 *
 * @example
 * async getAnalytics(@TimezoneWithFallback('America/New_York') timezone: string) {
 *   // timezone will be from header, or 'America/New_York' as fallback
 * }
 */
export const TimezoneWithFallback = (fallback: string = 'UTC') =>
  createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const timezone = request.headers['x-timezone'] as string;

    // Validate timezone if provided
    if (timezone) {
      try {
        // Test if the timezone is valid
        Intl.DateTimeFormat('en', { timeZone: timezone });
        return timezone;
      } catch (error) {
        console.warn(`Invalid timezone provided: ${timezone}. Falling back to: ${fallback}, error: ${error.message}`);
        // Invalid timezone, fall back to provided fallback
        return fallback;
      }
    }

    // No timezone provided, use fallback
    return fallback;
  })();
