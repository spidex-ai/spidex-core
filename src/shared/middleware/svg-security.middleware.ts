import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { getSecurityConfig, formatCSPDirectives, SECURITY_HEADERS } from '@shared/config/security.config';

@Injectable()
export class SvgSecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SvgSecurityMiddleware.name);
  private readonly securityConfig: any;

  constructor(private readonly configService: ConfigService) {
    this.securityConfig = getSecurityConfig(configService);
  }

  use(req: Request, res: Response, next: NextFunction): void {
    // Check if the request is for an SVG file
    const isSvgRequest = this.isSvgRequest(req);

    if (isSvgRequest) {
      this.logger.log(`Applying SVG security headers for: ${req.url}`);
      this.applySvgSecurityHeaders(res);
    }

    next();
  }

  private isSvgRequest(req: Request): boolean {
    // Check URL path for SVG files
    const urlPath = req.url.toLowerCase();
    if (urlPath.includes('.svg')) {
      return true;
    }

    // Check Accept header for SVG content
    const acceptHeader = req.headers.accept?.toLowerCase() || '';
    if (acceptHeader.includes('image/svg+xml')) {
      return true;
    }

    // Check Content-Type header for SVG uploads
    const contentType = req.headers['content-type']?.toLowerCase() || '';
    if (contentType.includes('image/svg+xml')) {
      return true;
    }

    return false;
  }

  private applySvgSecurityHeaders(res: Response): void {
    // Apply strict CSP for SVG files
    const svgCSP = formatCSPDirectives(this.securityConfig.svgSecurityPolicy.directives);
    res.setHeader('Content-Security-Policy', svgCSP);

    // Apply SVG-specific security headers
    Object.entries(SECURITY_HEADERS.SVG).forEach(([header, value]) => {
      res.setHeader(header, value);
    });

    this.logger.debug('Applied SVG security headers');
  }
}
