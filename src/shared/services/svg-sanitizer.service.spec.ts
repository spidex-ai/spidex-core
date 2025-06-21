import { Test, TestingModule } from '@nestjs/testing';
import { SvgSanitizerService } from './svg-sanitizer.service';

describe('SvgSanitizerService', () => {
  let service: SvgSanitizerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SvgSanitizerService],
    }).compile();

    service = module.get<SvgSanitizerService>(SvgSanitizerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sanitizeSvg', () => {
    it('should sanitize a clean SVG file', async () => {
      const cleanSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
          <circle cx="50" cy="50" r="40" fill="red" />
        </svg>
      `;

      const result = await service.sanitizeSvg(cleanSvg);

      expect(result.isValid).toBe(true);
      expect(result.sanitizedContent).toContain('<svg');
      expect(result.sanitizedContent).toContain('<circle');
      expect(result.sanitizedContent).not.toContain('<script');
    });

    it('should remove script tags from malicious SVG', async () => {
      const maliciousSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
          <script>alert('XSS Attack!');</script>
          <circle cx="50" cy="50" r="40" fill="red" />
        </svg>
      `;

      const result = await service.sanitizeSvg(maliciousSvg);

      expect(result.isValid).toBe(true);
      expect(result.sanitizedContent).not.toContain('<script');
      expect(result.sanitizedContent).not.toContain('alert');
      expect(result.sanitizedContent).toContain('<circle');
    });

    it('should remove event handlers from SVG elements', async () => {
      const maliciousSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
          <circle cx="50" cy="50" r="40" fill="red" onclick="alert('XSS')" onload="maliciousFunction()" />
        </svg>
      `;

      const result = await service.sanitizeSvg(maliciousSvg);

      expect(result.isValid).toBe(true);
      expect(result.sanitizedContent).not.toContain('onclick');
      expect(result.sanitizedContent).not.toContain('onload');
      expect(result.sanitizedContent).not.toContain('alert');
      expect(result.sanitizedContent).toContain('<circle');
    });

    it('should remove javascript: URLs', async () => {
      const maliciousSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
          <a href="javascript:alert('XSS')">
            <circle cx="50" cy="50" r="40" fill="red" />
          </a>
        </svg>
      `;

      const result = await service.sanitizeSvg(maliciousSvg);

      expect(result.isValid).toBe(true);
      expect(result.sanitizedContent).not.toContain('javascript:');
      expect(result.sanitizedContent).not.toContain('alert');
    });

    it('should remove foreignObject elements', async () => {
      const maliciousSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
          <foreignObject>
            <div xmlns="http://www.w3.org/1999/xhtml">
              <script>alert('XSS via foreignObject');</script>
            </div>
          </foreignObject>
          <circle cx="50" cy="50" r="40" fill="red" />
        </svg>
      `;

      const result = await service.sanitizeSvg(maliciousSvg);

      expect(result.isValid).toBe(true);
      expect(result.sanitizedContent).not.toContain('<foreignObject');
      expect(result.sanitizedContent).not.toContain('<script');
      expect(result.sanitizedContent).not.toContain('alert');
      expect(result.sanitizedContent).toContain('<circle');
    });

    it('should remove data: URLs with HTML content', async () => {
      const maliciousSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
          <image href="data:text/html,<script>alert('XSS')</script>" />
          <circle cx="50" cy="50" r="40" fill="red" />
        </svg>
      `;

      const result = await service.sanitizeSvg(maliciousSvg);

      expect(result.isValid).toBe(true);
      expect(result.sanitizedContent).not.toContain('data:text/html');
      expect(result.sanitizedContent).not.toContain('alert');
    });

    it('should reject invalid SVG structure', async () => {
      const invalidSvg = `
        <div>This is not an SVG</div>
      `;

      const result = await service.sanitizeSvg(invalidSvg);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid SVG structure');
    });

    it('should handle empty or malformed content', async () => {
      const emptySvg = '';

      const result = await service.sanitizeSvg(emptySvg);

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should preserve safe SVG attributes', async () => {
      const safeSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="red" stroke="blue" stroke-width="2" />
          <rect x="10" y="10" width="30" height="30" fill="green" opacity="0.5" />
        </svg>
      `;

      const result = await service.sanitizeSvg(safeSvg);

      expect(result.isValid).toBe(true);
      expect(result.sanitizedContent).toContain('viewBox');
      expect(result.sanitizedContent).toContain('fill="red"');
      expect(result.sanitizedContent).toContain('stroke="blue"');
      expect(result.sanitizedContent).toContain('opacity="0.5"');
    });

    it('should remove XML processing instructions', async () => {
      const svgWithXml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
          <circle cx="50" cy="50" r="40" fill="red" />
        </svg>
      `;

      const result = await service.sanitizeSvg(svgWithXml);

      expect(result.isValid).toBe(true);
      expect(result.sanitizedContent).not.toContain('<?xml');
      expect(result.sanitizedContent).not.toContain('<!DOCTYPE');
      expect(result.sanitizedContent).toContain('<svg');
    });
  });

  describe('validateSvgFile', () => {
    it('should validate a buffer containing clean SVG', async () => {
      const cleanSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
          <circle cx="50" cy="50" r="40" fill="red" />
        </svg>
      `;
      const buffer = Buffer.from(cleanSvg, 'utf8');

      const result = await service.validateSvgFile(buffer);

      expect(result.isValid).toBe(true);
      expect(result.sanitizedContent).toContain('<svg');
    });

    it('should reject buffer containing malicious SVG', async () => {
      const maliciousSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
          <script>alert('XSS');</script>
        </svg>
      `;
      const buffer = Buffer.from(maliciousSvg, 'utf8');

      const result = await service.validateSvgFile(buffer);

      expect(result.isValid).toBe(true); // Should be valid after sanitization
      expect(result.sanitizedContent).not.toContain('<script');
      expect(result.sanitizedContent).not.toContain('alert');
    });

    it('should handle invalid buffer content', async () => {
      const invalidContent = 'This is not SVG content';
      const buffer = Buffer.from(invalidContent, 'utf8');

      const result = await service.validateSvgFile(buffer);

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
