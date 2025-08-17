import { EGuardDecoratorKey } from '@constants/auth.constant';
import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AdminGuard, UserGuard } from '@shared/guards/user.guard';
import { VerifyRecaptchaGuard } from '@shared/guards/verify-recaptcha.guard';

export const GuardPublic = () => SetMetadata(EGuardDecoratorKey.IS_PUBLIC_KEY, true);

export const GuardPublicOrAuth = () => SetMetadata(EGuardDecoratorKey.IS_PUBLIC_OR_AUTH_KEY, true);

export function AuthUserGuard(): MethodDecorator {
  return applyDecorators(UseGuards(UserGuard), ApiBearerAuth('Authorization'));
}

export function VerifyRecaptra(): MethodDecorator {
  return applyDecorators(UseGuards(VerifyRecaptchaGuard));
}

export function AuthAdminGuard(): MethodDecorator {
  return applyDecorators(UseGuards(AdminGuard), ApiBearerAuth('Authorization'));
}
