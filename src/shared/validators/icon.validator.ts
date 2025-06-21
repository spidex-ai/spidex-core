import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsValidIconConstraint implements ValidatorConstraintInterface {
  validate(icon: string): boolean {
    if (!icon) return true; // Allow empty/null values since icon is optional

    // Check if it's a valid URL
    try {
      const url = new URL(icon);
      // Allow http, https, and relative paths
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        return this.isValidImageUrl(icon);
      }
    } catch {
      // If URL parsing fails, check if it's a valid relative path
      return this.isValidRelativePath(icon);
    }

    return false;
  }

  private isValidImageUrl(url: string): boolean {
    // Check for common image file extensions
    const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico)$/i;
    return imageExtensions.test(url);
  }

  private isValidRelativePath(path: string): boolean {
    // Check for valid relative paths starting with / or ./
    if (!path.startsWith('/') && !path.startsWith('./')) {
      return false;
    }

    // Check for common image file extensions
    const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico)$/i;
    return imageExtensions.test(path);
  }

  defaultMessage(): string {
    return 'Icon must be a valid image URL or relative path with supported image format (jpg, jpeg, png, gif, bmp, webp, svg, ico)';
  }
}

export function IsValidIcon(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidIconConstraint,
    });
  };
}
