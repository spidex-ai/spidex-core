# Security Documentation

## SVG Upload Security Implementation

This document outlines the comprehensive security measures implemented to prevent XSS attacks through SVG file uploads.

### 🚨 **Security Vulnerability Fixed**

**Issue**: The application was vulnerable to stored XSS attacks through malicious SVG file uploads. Attackers could upload SVG files containing JavaScript code that would execute when other users viewed the profile pictures.

**Impact**: 
- Cross-site scripting (XSS) attacks
- Session hijacking
- Data theft
- Malicious code execution in user browsers

### 🛡️ **Security Measures Implemented**

#### 1. **SVG Content Sanitization**

**Location**: `src/shared/services/svg-sanitizer.service.ts`

- **Server-side sanitization** using DOMPurify with JSDOM
- **Removes dangerous elements**: `<script>`, `<object>`, `<embed>`, `<iframe>`, `<foreignObject>`, etc.
- **Strips event handlers**: `onclick`, `onload`, `onerror`, etc.
- **Blocks dangerous URLs**: `javascript:`, `data:text/html`, etc.
- **Preserves safe SVG functionality**: shapes, paths, gradients, animations

```typescript
// Example of sanitized content
const maliciousSvg = `<svg><script>alert('XSS')</script><circle r="10"/></svg>`;
const result = await svgSanitizerService.sanitizeSvg(maliciousSvg);
// Result: `<svg><circle r="10"/></svg>` (script removed)
```

#### 2. **File Upload Validation**

**Location**: `src/shared/utils/upload.ts`

- **File size limits**: SVG files limited to 1MB
- **Content validation**: Basic structure and dangerous pattern detection
- **Extension verification**: Proper file type checking
- **Buffer analysis**: Content inspection before processing

#### 3. **Content Security Policy (CSP)**

**Location**: `src/shared/config/security.config.ts`

- **Strict CSP for SVG files**: Completely blocks script execution
- **Application-wide CSP**: Prevents inline scripts and unsafe evaluations
- **Environment-specific policies**: Different rules for development vs production

```http
Content-Security-Policy: default-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'none'
```

#### 4. **Security Headers**

**Location**: `src/shared/middleware/svg-security.middleware.ts`

Applied to all SVG requests:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: no-referrer`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`

#### 5. **Secure File Processing**

**Location**: `src/modules/medias/medias.service.ts`

- **Automatic sanitization** of all SVG uploads
- **Content-type enforcement**: Forces `image/svg+xml`
- **Filename modification**: Adds `_sanitized` suffix to indicate processing
- **Error handling**: Rejects files that cannot be safely sanitized

### 🧪 **Testing Coverage**

**Location**: `src/shared/services/svg-sanitizer.service.spec.ts`

Comprehensive test suite covering:
- ✅ Clean SVG file processing
- ✅ Script tag removal
- ✅ Event handler stripping
- ✅ JavaScript URL blocking
- ✅ ForeignObject element removal
- ✅ Data URL sanitization
- ✅ Invalid content rejection
- ✅ Safe attribute preservation

### 🔄 **Security Workflow**

1. **Upload Request**: User uploads SVG file
2. **Initial Validation**: File extension, size, and basic content checks
3. **Content Sanitization**: DOMPurify removes dangerous elements/attributes
4. **Security Verification**: Final validation of sanitized content
5. **Secure Storage**: Upload to S3 with safe content-type
6. **Secure Serving**: Apply strict CSP and security headers

### 📋 **Security Checklist**

- [x] SVG content sanitization implemented
- [x] File upload validation enhanced
- [x] Content Security Policy configured
- [x] Security headers applied
- [x] Comprehensive test coverage
- [x] Error handling and logging
- [x] Documentation completed

### 🚀 **Deployment Notes**

1. **Dependencies**: Ensure `dompurify` and `jsdom` are installed
2. **Environment Variables**: No new variables required
3. **Database**: No schema changes needed
4. **Monitoring**: Check logs for sanitization activities

### 🔍 **Monitoring and Alerts**

Monitor these log messages:
- `SVG sanitized successfully` - Normal operation
- `SVG sanitization failed` - Potential attack attempt
- `Applied SVG security headers` - Security middleware active

### 📚 **Additional Resources**

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [SVG Security Guidelines](https://github.com/w3c/svgwg/wiki/SVG-Security)
- [Content Security Policy Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

### 🔧 **Configuration**

#### Environment Variables
```bash
# No new environment variables required
# Existing variables used:
NODE_ENV=production
S3_URL=https://your-cdn.com
```

#### Security Headers Configuration
```typescript
// Customize in src/shared/config/security.config.ts
const securityConfig = getSecurityConfig(configService);
```

### ⚠️ **Important Notes**

1. **Backward Compatibility**: Existing SVG files will be re-sanitized on next access
2. **Performance**: Sanitization adds ~50-100ms processing time per SVG
3. **File Size**: Sanitized SVGs may be slightly smaller due to removed content
4. **Caching**: Sanitized SVGs are cached with immutable headers for performance

### 🆘 **Emergency Response**

If a malicious SVG bypasses these protections:

1. **Immediate**: Block the specific file URL
2. **Short-term**: Increase CSP strictness
3. **Long-term**: Review and enhance sanitization rules
4. **Monitoring**: Check for similar attack patterns

---

**Last Updated**: 2025-06-21  
**Security Review**: Completed  
**Next Review**: 2025-09-21
