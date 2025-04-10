export enum EAuthGuard {
  USER_GUARD = 'userjwt',
  ADMIN_GUARD = 'adminjwt',
  JWT = 'JWT',
}

export enum EGuardDecoratorKey {
  IS_PUBLIC_KEY = 'IS_PUBLIC_KEY',
  IS_PUBLIC_OR_AUTH_KEY = 'IS_PUBLIC_OR_AUTH_KEY',
}

export const NONE_PERMISSION_KEY = 'none_permission';
export const REGEX_PASSWORD = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,30}$/;
