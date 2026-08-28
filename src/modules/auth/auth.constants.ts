// modules/auth/auth.constants.ts
export const AUTH_CONSTANTS = {
  COOKIE_NAME: 'lms_session',
  COOKIE_MAX_AGE: 30 * 24 * 60 * 60 * 1000, // 30 days
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '30d',
} as const;