// modules/auth/auth.middleware.ts
import { NextFunction, Response } from 'express';
import { AuthService } from './auth.service.js';
import { AuthenticatedRequest, CurrentUser } from './auth.types.js';
import { AppError, ErrorCode } from '../../common/errors/index.js';
import { verifyToken } from '../../common/utils/jwt.utils.js';
import logger from '../../config/logger.js';
import { AUTH_CONSTANTS } from './auth.constants.js';
import { getAuthService } from '../../common/bootstrap/auth.bootstrap.js';
import { getPrismaClient } from '../../config/database.js';

/**
 * Build a base CurrentUser from the JWT payload fields.
 * Uses the actual field names the auth service puts in the token.
 */
function baseUserFromToken(payload: ReturnType<typeof verifyToken>): CurrentUser {
  return {
    userId:    payload.userId,
    email:     payload.email,
    companyId: Number(payload.companyId ?? payload.company_id),
    roleId:    String(payload.roleId),
    role:      payload.role ?? '',
    roleName:  payload.role ?? '',
    permissions: [],
    // appUserId and employeeId populated below by DB lookup
  };
}

/**
 * Enrich CurrentUser with LMS AppUser data (appUserId, employeeId, permissions).
 * Non-blocking — if the AppUser row doesn't exist yet (pending EDM sync),
 * the user can still authenticate with reduced permissions.
 */
async function enrichFromAppUser(user: CurrentUser): Promise<void> {
  try {
    const prisma = getPrismaClient();
    const appUser = await prisma.appUser.findFirst({
      where: { email: user.email, companyId: user.companyId, isActive: true },
      select: {
        id: true,
        employeeId: true,
        roleId: true,
        role: {
          select: {
            lmsPermissions: {
              where: { companyId: user.companyId },
              select: { permission: { select: { code: true } } },
            },
          },
        },
      },
    });

    if (appUser) {
      user.appUserId   = appUser.id;
      user.employeeId  = appUser.employeeId ?? undefined;
      user.permissions = appUser.role?.lmsPermissions.map(rp => rp.permission.code) ?? [];
    }
  } catch (err) {
    // Never block authentication because of an enrichment failure
    logger.warn('[AuthMiddleware] AppUser enrichment failed (non-fatal):', err);
  }
}

export class AuthMiddleware {
  constructor(private authService: AuthService) {}

  authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const sessionId = req.cookies?.[AUTH_CONSTANTS.COOKIE_NAME];
      if (!sessionId) {
        throw new AppError('Session cookie not found.', 401, ErrorCode.UNAUTHORIZED);
      }

      const session = await this.authService.getSession(sessionId);
      if (!session) {
        throw new AppError('Session expired or invalid.', 401, ErrorCode.UNAUTHORIZED);
      }

      let tokenPayload = verifyToken(session.accessToken);

      // Refresh expired token via RabbitMQ RPC
      if (tokenPayload.exp && tokenPayload.exp < Date.now() / 1000) {
        const refreshed = await this.authService.refreshTokens(sessionId);
        if (!refreshed) {
          throw new AppError('Session expired. Please log in again.', 401, ErrorCode.UNAUTHORIZED);
        }
        tokenPayload = verifyToken(refreshed.access_token);
      }

      // Build CurrentUser from JWT, then enrich with LMS AppUser data
      const user = baseUserFromToken(tokenPayload);
      await enrichFromAppUser(user);

      req.user      = user;
      req.sessionId = sessionId;

      logger.debug(`[AuthMiddleware] Authenticated userId=${user.userId} appUserId=${user.appUserId ?? 'not synced'}`);
      next();
    } catch (error) {
      next(error);
    }
  };
}

// Lazy export — resolves AuthService at request time
export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  new AuthMiddleware(getAuthService()).authenticate(req, res, next);
};
