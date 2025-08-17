import { Injectable, Logger } from '@nestjs/common';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

export interface ISvgSanitizationResult {
  isValid: boolean;
  sanitizedContent?: string;
  originalSize?: number;
  sanitizedSize?: number;
  removedElements?: string[];
  error?: string;
}

@Injectable()
export class SvgSanitizerService {
  private readonly logger = new Logger(SvgSanitizerService.name);
  private readonly domPurify: typeof DOMPurify;

  // Dangerous SVG elements that should be removed
  private readonly dangerousElements = [
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
  ];

  // Dangerous attributes that should be removed
  private readonly dangerousAttributes = [
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
  ];

  constructor() {
    // Initialize JSDOM window for server-side DOMPurify
    const window = new JSDOM('').window;
    this.domPurify = DOMPurify(window as any);

    // Configure DOMPurify for SVG sanitization
    this.configureDOMPurify();
  }

  private configureDOMPurify(): void {
    // Add custom configuration for SVG sanitization
    this.domPurify.addHook('beforeSanitizeElements', node => {
      // Remove dangerous elements
      if (this.dangerousElements.includes(node.nodeName.toLowerCase())) {
        this.logger.warn(`Removing dangerous element: ${node.nodeName}`);
        return node;
      }
    });

    this.domPurify.addHook('beforeSanitizeAttributes', node => {
      // Remove dangerous attributes
      if (node.attributes) {
        for (let i = node.attributes.length - 1; i >= 0; i--) {
          const attr = node.attributes[i];
          const attrName = attr.name.toLowerCase();

          // Remove event handlers and dangerous attributes
          if (this.dangerousAttributes.some(dangerous => attrName.includes(dangerous))) {
            this.logger.warn(`Removing dangerous attribute: ${attr.name} from ${node.nodeName}`);
            node.removeAttribute(attr.name);
          }

          // Remove javascript: and data: URLs
          if (
            attr.value &&
            (attr.value.toLowerCase().includes('javascript:') ||
              attr.value.toLowerCase().includes('data:text/html') ||
              attr.value.toLowerCase().includes('data:image/svg+xml'))
          ) {
            this.logger.warn(`Removing dangerous attribute value: ${attr.name}="${attr.value}"`);
            node.removeAttribute(attr.name);
          }
        }
      }
    });
  }

  async sanitizeSvg(svgContent: string): Promise<ISvgSanitizationResult> {
    try {
      const originalSize = Buffer.byteLength(svgContent, 'utf8');

      // Basic validation - check if it's actually SVG content
      if (!this.isValidSvgStructure(svgContent)) {
        return {
          isValid: false,
          error: 'Invalid SVG structure - missing SVG root element',
          originalSize,
        };
      }

      // Remove XML processing instructions and DOCTYPE declarations
      const cleanedContent = svgContent
        .replace(/<\?xml[^>]*\?>/gi, '')
        .replace(/<!DOCTYPE[^>]*>/gi, '')
        .trim();

      // Use DOMPurify to sanitize the SVG
      const sanitizedContent = this.domPurify.sanitize(cleanedContent, {
        USE_PROFILES: { svg: true, svgFilters: true },
        ALLOWED_TAGS: [
          'svg',
          'g',
          'path',
          'circle',
          'ellipse',
          'line',
          'rect',
          'polyline',
          'polygon',
          'text',
          'tspan',
          'tref',
          'textPath',
          'defs',
          'clipPath',
          'mask',
          'pattern',
          'image',
          'switch',
          'foreignObject',
          'marker',
          'symbol',
          'use',
          'view',
          'animate',
          'animateColor',
          'animateMotion',
          'animateTransform',
          'set',
          'linearGradient',
          'radialGradient',
          'stop',
          'filter',
          'feBlend',
          'feColorMatrix',
          'feComponentTransfer',
          'feComposite',
          'feConvolveMatrix',
          'feDiffuseLighting',
          'feDisplacementMap',
          'feDistantLight',
          'feDropShadow',
          'feFlood',
          'feFuncA',
          'feFuncB',
          'feFuncG',
          'feFuncR',
          'feGaussianBlur',
          'feImage',
          'feMerge',
          'feMergeNode',
          'feMorphology',
          'feOffset',
          'fePointLight',
          'feSpecularLighting',
          'feSpotLight',
          'feTile',
          'feTurbulence',
        ],
        ALLOWED_ATTR: [
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
          'startOffset',
          'method',
          'spacing',
          'glyphRef',
          'format',
          'markerUnits',
          'refX',
          'refY',
          'markerWidth',
          'markerHeight',
          'orient',
          'gradientUnits',
          'gradientTransform',
          'spreadMethod',
          'fx',
          'fy',
          'offset',
          'stop-color',
          'stop-opacity',
          'patternUnits',
          'patternContentUnits',
          'patternTransform',
          'clipPathUnits',
          'maskUnits',
          'maskContentUnits',
          'filterUnits',
          'primitiveUnits',
          'in',
          'in2',
          'result',
          'values',
          'type',
          'tableValues',
          'slope',
          'intercept',
          'amplitude',
          'exponent',
          'k1',
          'k2',
          'k3',
          'k4',
          'operator',
          'radius',
          'stdDeviation',
          'edgeMode',
          'kernelMatrix',
          'bias',
          'targetX',
          'targetY',
          'surfaceScale',
          'specularConstant',
          'specularExponent',
          'limitingConeAngle',
          'pointsAtX',
          'pointsAtY',
          'pointsAtZ',
          'azimuth',
          'elevation',
          'diffuseConstant',
          'kernelUnitLength',
          'scale',
          'xChannelSelector',
          'yChannelSelector',
          'mode',
          'order',
          'seed',
          'stitchTiles',
          'baseFrequency',
          'numOctaves',
        ],
        FORBID_TAGS: this.dangerousElements,
        FORBID_ATTR: this.dangerousAttributes,
        KEEP_CONTENT: false,
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,
        SANITIZE_DOM: true,
        WHOLE_DOCUMENT: false,
      });

      const sanitizedSize = Buffer.byteLength(sanitizedContent, 'utf8');

      // Validate the sanitized result
      if (!sanitizedContent || sanitizedContent.trim().length === 0) {
        return {
          isValid: false,
          error: 'SVG content was completely removed during sanitization',
          originalSize,
        };
      }

      // Final validation - ensure it's still valid SVG
      if (!this.isValidSvgStructure(sanitizedContent)) {
        return {
          isValid: false,
          error: 'Sanitized content is not valid SVG',
          originalSize,
          sanitizedSize,
        };
      }

      this.logger.log(`SVG sanitized successfully. Size: ${originalSize} -> ${sanitizedSize} bytes`);

      return {
        isValid: true,
        sanitizedContent,
        originalSize,
        sanitizedSize,
        removedElements: [], // DOMPurify doesn't provide this info directly
      };
    } catch (error) {
      this.logger.error(`SVG sanitization failed: ${error.message}`, error.stack);
      return {
        isValid: false,
        error: `Sanitization failed: ${error.message}`,
      };
    }
  }

  private isValidSvgStructure(content: string): boolean {
    try {
      // Check for SVG root element
      const svgRegex = /<svg[^>]*>/i;
      const closingSvgRegex = /<\/svg>/i;

      return svgRegex.test(content) && closingSvgRegex.test(content);
    } catch {
      return false;
    }
  }

  async validateSvgFile(buffer: Buffer): Promise<ISvgSanitizationResult> {
    try {
      const content = buffer.toString('utf8');
      return await this.sanitizeSvg(content);
    } catch (error) {
      this.logger.error(`SVG file validation failed: ${error.message}`);
      return {
        isValid: false,
        error: `File validation failed: ${error.message}`,
      };
    }
  }
}
