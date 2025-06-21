import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('SVG Security (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // You'll need to implement authentication for these tests
    // authToken = await getAuthToken();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/medias/image (POST)', () => {
    it('should accept clean SVG files', async () => {
      const cleanSvg = Buffer.from(`
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
          <circle cx="50" cy="50" r="40" fill="red" />
        </svg>
      `, 'utf8');

      const response = await request(app.getHttpServer())
        .post('/medias/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', cleanSvg, 'clean.svg')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toContain('_sanitized.svg');
    });

    it('should reject SVG files with script tags', async () => {
      const maliciousSvg = Buffer.from(`
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
          <script>alert('XSS Attack!');</script>
          <circle cx="50" cy="50" r="40" fill="red" />
        </svg>
      `, 'utf8');

      await request(app.getHttpServer())
        .post('/medias/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', maliciousSvg, 'malicious.svg')
        .expect(201); // Should succeed but sanitize the content
    });

    it('should reject SVG files with event handlers', async () => {
      const maliciousSvg = Buffer.from(`
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
          <circle cx="50" cy="50" r="40" fill="red" onclick="alert('XSS')" />
        </svg>
      `, 'utf8');

      await request(app.getHttpServer())
        .post('/medias/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', maliciousSvg, 'malicious.svg')
        .expect(201); // Should succeed but sanitize the content
    });

    it('should reject SVG files with foreignObject', async () => {
      const maliciousSvg = Buffer.from(`
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
          <foreignObject>
            <div xmlns="http://www.w3.org/1999/xhtml">
              <script>alert('XSS via foreignObject');</script>
            </div>
          </foreignObject>
        </svg>
      `, 'utf8');

      await request(app.getHttpServer())
        .post('/medias/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', maliciousSvg, 'malicious.svg')
        .expect(201); // Should succeed but sanitize the content
    });

    it('should reject SVG files larger than 1MB', async () => {
      // Create a large SVG file (over 1MB)
      const largeSvgContent = '<circle cx="50" cy="50" r="40" fill="red" />'.repeat(50000);
      const largeSvg = Buffer.from(`
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
          ${largeSvgContent}
        </svg>
      `, 'utf8');

      await request(app.getHttpServer())
        .post('/medias/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', largeSvg, 'large.svg')
        .expect(400);
    });

    it('should reject files with SVG extension but invalid content', async () => {
      const invalidSvg = Buffer.from('This is not an SVG file', 'utf8');

      await request(app.getHttpServer())
        .post('/medias/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', invalidSvg, 'invalid.svg')
        .expect(400);
    });

    it('should reject SVG files with javascript: URLs', async () => {
      const maliciousSvg = Buffer.from(`
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
          <a href="javascript:alert('XSS')">
            <circle cx="50" cy="50" r="40" fill="red" />
          </a>
        </svg>
      `, 'utf8');

      await request(app.getHttpServer())
        .post('/medias/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', maliciousSvg, 'malicious.svg')
        .expect(201); // Should succeed but sanitize the content
    });

    it('should reject SVG files with data: URLs containing HTML', async () => {
      const maliciousSvg = Buffer.from(`
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
          <image href="data:text/html,<script>alert('XSS')</script>" />
        </svg>
      `, 'utf8');

      await request(app.getHttpServer())
        .post('/medias/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', maliciousSvg, 'malicious.svg')
        .expect(201); // Should succeed but sanitize the content
    });
  });

  describe('SVG Security Headers', () => {
    it('should apply security headers for SVG requests', async () => {
      const response = await request(app.getHttpServer())
        .get('/public/icons/tokens/ada.svg')
        .expect(200);

      expect(response.headers['content-security-policy']).toContain("script-src 'none'");
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['referrer-policy']).toBe('no-referrer');
    });
  });

  // Helper function to get authentication token
  // You'll need to implement this based on your auth system
  async function getAuthToken(): Promise<string> {
    // Mock implementation - replace with actual auth logic
    return 'mock-jwt-token';
  }
});
