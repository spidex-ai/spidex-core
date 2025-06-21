import { ConfigService } from '@nestjs/config';

export interface SecurityConfig {
  contentSecurityPolicy: {
    directives: Record<string, string[]>;
  };
  svgSecurityPolicy: {
    directives: Record<string, string[]>;
  };
}

export function getSecurityConfig(configService: ConfigService): SecurityConfig {
  const isDevelopment = configService.get('NODE_ENV') === 'development';
  // const baseUrl = configService.get('APP_BASE_URL') || 'http://localhost:8000';
  const s3Url = configService.get('S3_URL') || '';

  // Base CSP for the application
  const baseCSP = {
    defaultSrc: ["'self'"],
    scriptSrc: isDevelopment ? ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https:', 'http:'] : ["'self'", 'https:'],
    styleSrc: ["'self'", "'unsafe-inline'", 'https:', 'fonts.googleapis.com'],
    imgSrc: ["'self'", 'data:', 'https:', 'blob:', s3Url].filter(Boolean),
    fontSrc: ["'self'", 'https:', 'data:', 'fonts.gstatic.com'],
    connectSrc: ["'self'", 'https:', 'wss:', 'ws:'],
    mediaSrc: ["'self'", 'https:', s3Url].filter(Boolean),
    objectSrc: ["'none'"],
    childSrc: ["'self'", 'https:'],
    frameSrc: ["'self'", 'https:'],
    workerSrc: ["'self'", 'blob:'],
    manifestSrc: ["'self'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    upgradeInsecureRequests: isDevelopment ? [] : [''],
  };

  // Strict CSP for SVG files to prevent XSS
  const svgCSP = {
    defaultSrc: ["'none'"],
    imgSrc: ["'self'", 'data:'],
    styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for SVG styling
    scriptSrc: ["'none'"], // Completely block scripts in SVG
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"],
    frameSrc: ["'none'"],
    workerSrc: ["'none'"],
    childSrc: ["'none'"],
    formAction: ["'none'"],
    baseUri: ["'none'"],
    manifestSrc: ["'none'"],
    mediaSrc: ["'none'"],
    connectSrc: ["'none'"],
    fontSrc: ["'none'"],
  };

  return {
    contentSecurityPolicy: {
      directives: baseCSP,
    },
    svgSecurityPolicy: {
      directives: svgCSP,
    },
  };
}

export function formatCSPDirectives(directives: Record<string, string[]>): string {
  return Object.entries(directives)
    .filter(([, values]) => values.length > 0)
    .map(([directive, values]) => {
      const kebabDirective = directive.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${kebabDirective} ${values.join(' ')}`;
    })
    .join('; ');
}

// Security headers for different content types
export const SECURITY_HEADERS = {
  // General security headers
  GENERAL: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy':
      'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=()',
  },

  // Headers specifically for SVG files
  SVG: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'no-referrer',
    'Cache-Control': 'public, max-age=31536000, immutable', // Cache sanitized SVGs for 1 year
    'Permissions-Policy':
      'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=()',
    // Note: CSP header is set dynamically in middleware
  },

  // Headers for uploaded media files
  MEDIA: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN', // Allow framing for media preview
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cache-Control': 'public, max-age=86400', // Cache for 1 day
  },
};

// Dangerous SVG elements and attributes (for reference)
export const SVG_SECURITY_RULES = {
  DANGEROUS_ELEMENTS: [
    'script',
    'object',
    'embed',
    'iframe',
    'frame',
    'frameset',
    'applet',
    'base',
    'link',
    'meta',
    'style',
    'foreignObject',
    'annotation-xml',
  ],

  DANGEROUS_ATTRIBUTES: [
    'onload',
    'onerror',
    'onclick',
    'onmouseover',
    'onmouseout',
    'onmousemove',
    'onmousedown',
    'onmouseup',
    'onfocus',
    'onblur',
    'onkeypress',
    'onkeydown',
    'onkeyup',
    'onsubmit',
    'onreset',
    'onselect',
    'onchange',
    'onabort',
    'onunload',
    'onresize',
    'onscroll',
    'href',
    'xlink:href',
    'action',
    'formaction',
    'ping',
    'autofocus',
    'background',
    'poster',
    'src',
  ],

  DANGEROUS_PROTOCOLS: ['javascript:', 'data:text/html', 'data:image/svg+xml', 'vbscript:', 'file:'],

  SAFE_ATTRIBUTES: [
    'class',
    'id',
    'style',
    'transform',
    'fill',
    'stroke',
    'stroke-width',
    'stroke-linecap',
    'stroke-linejoin',
    'stroke-dasharray',
    'stroke-dashoffset',
    'fill-opacity',
    'stroke-opacity',
    'opacity',
    'visibility',
    'display',
    'x',
    'y',
    'x1',
    'y1',
    'x2',
    'y2',
    'cx',
    'cy',
    'r',
    'rx',
    'ry',
    'width',
    'height',
    'viewBox',
    'preserveAspectRatio',
    'xmlns',
    'xmlns:xlink',
    'd',
    'points',
    'dx',
    'dy',
    'rotate',
    'textLength',
    'lengthAdjust',
  ],
};
