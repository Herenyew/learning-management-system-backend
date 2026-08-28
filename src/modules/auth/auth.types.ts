// modules/auth/auth.types.ts
import { Request } from 'express';

/**
 * Exact shape of the JWT payload issued by the Auth Service.
 * Field names MUST match what authHelpers.ts signs into the token.
 */
export interface TokenPayload {
  // Auth service fields
  userId: string;          // UUID — the auth service user ID (maps to ServiceSession.userId)
  roleId: string;          // string role code e.g. "001", "002"
  role: string;            // role name e.g. "admin", "user"
  email: string;
  companyId: number;
  company_id: number;      // duplicate field the auth service includes
  sessionId: string;       // auth service session ID (not the LMS session)
  sub: string;             // same as userId
  appUserId?: number;
  onboarding_status?: string;
  iat: number;
  exp: number;
}

/**
 * Normalized user identity attached to every authenticated request.
 * Built from the JWT payload — does NOT require a DB lookup for basic auth.
 */
export interface CurrentUser {
  // Auth service identity
  userId: string;          // UUID from auth service
  email: string;
  companyId: number;
  roleId: string;          // string code from auth service
  role: string;            // role name from auth service
  roleName?: string;       // alias for role, used by frontend mapping
  permissions: string[];   // LMS-specific permissions (populated if AppUser synced)
  // LMS-specific (optional — only populated when AppUser record exists in LMS DB)
  appUserId?: number;
  employeeId?: string;
}

export interface AuthenticatedRequest extends Request {
  user: CurrentUser;
  sessionId?: string;
}

export type PermissionMode = 'ALL' | 'ANY';

// OAuth2 types
export interface OAuth2TokenResponse {
  success: boolean;
  access_token: string;
  refresh_token: string;
  user_id: string;
  company_id: number;
  auth_session_id: string;
  access_token_expires_at: string;
  refresh_token_expires_at: string;
  email?: string;
}

export interface SessionData {
  userId: string;
  companyId: number;
  authSessionId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}
