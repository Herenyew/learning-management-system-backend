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
 */
function baseUserFromToken(payload: ReturnType<typeof verifyToken>): CurrentUser {
  return {
    userId:    payload.userId,
    email:     payload.email,
    companyId: (() => {
      const raw = payload.companyId ?? payload.company_id;
      const n = Number(raw);
      return (raw != null && !isNaN(n)) ? n : 1;
    })(),
    roleId:    String(payload.roleId ?? ''),
    role:      payload.role ?? '',
    roleName:  payload.role ?? '',
    permissions: [],
  };
}

/**
 * Resolve which LMS AppRole to assign to this user.
 *
 * Strategy — in priority order:
 *
 *  1. AppUser already exists in LMS DB → trust the stored roleId directly.
 *     The LMS DB is the source of truth for LMS role assignment.
 *     The only time we update it is when the JWT role NAME changes (e.g. someone
 *     was promoted in EMS).
 *
 *  2. No AppUser yet (first login) → look up LMS AppRole by the role NAME from
 *     the JWT.  This works for any role the admin creates in the future — no
 *     hardcoded IDs needed.
 *
 *  3. If name lookup fails (role name in JWT doesn't match any LMS AppRole) →
 *     fall back to numeric ID lookup using the JWT roleId field.
 *
 *  4. Final fallback: assign the EMPLOYEE role (the safest default).
 */
async function resolveAppRole(
  prisma: ReturnType<typeof getPrismaClient>,
  companyId: number,
  jwtRoleName: string,
  jwtRoleId: string,
  existingRoleId: number | null,
): Promise<number | null> {

  // Step 1 — if existing LMS AppUser already has a role, check if the JWT
  // role name still matches. If the name changed (promotion/demotion in EMS),
  // we need to re-resolve. If it's the same, keep the existing roleId as-is.
  if (existingRoleId !== null) {
    const existingRole = await prisma.appRole.findUnique({
      where: { id: existingRoleId },
      select: { name: true },
    });
    if (existingRole) {
      const namesMatch = existingRole.name.toLowerCase() === jwtRoleName.toLowerCase();
      if (namesMatch) {
        // Same role — no change needed
        return existingRoleId;
      }
      // Role name changed in EMS → re-resolve below
      logger.info(
        `[AuthMiddleware] Role name changed: LMS had "${existingRole.name}", JWT says "${jwtRoleName}" — re-resolving`
      );
    }
  }

  // Step 2 — look up by JWT role NAME within this company
  if (jwtRoleName) {
    const byName = await prisma.appRole.findFirst({
      where: {
        name: { equals: jwtRoleName, mode: 'insensitive' },
        companyId,
      },
      select: { id: true },
    });
    if (byName) return byName.id;

    // Also try without company scope (system-wide roles)
    const byNameGlobal = await prisma.appRole.findFirst({
      where: { name: { equals: jwtRoleName, mode: 'insensitive' } },
      select: { id: true },
    });
    if (byNameGlobal) return byNameGlobal.id;
  }

  // Step 3 — fall back to numeric ID from JWT
  const numericId = parseInt(jwtRoleId, 10);
  if (!isNaN(numericId)) {
    const byId = await prisma.appRole.findUnique({
      where: { id: numericId },
      select: { id: true },
    });
    if (byId) return byId.id;
  }

  // Step 4 — final fallback: EMPLOYEE (safest default, least privilege)
  const employee = await prisma.appRole.findFirst({
    where: { name: { equals: 'EMPLOYEE', mode: 'insensitive' }, companyId },
    select: { id: true },
  });
  return employee?.id ?? null;
}

/**
 * Enrich CurrentUser with LMS AppUser data (appUserId, employeeId, permissions).
 * Non-blocking — if enrichment fails the user can still authenticate with no permissions.
 */
async function enrichFromAppUser(user: CurrentUser): Promise<void> {
  try {
    const prisma = getPrismaClient();

    // ── 1. Find existing AppUser by email + company ──────────────────────
    let appUser = await prisma.appUser.findFirst({
      where: {
        email: { equals: user.email, mode: 'insensitive' },
        companyId: user.companyId,
        isActive: true,
      },
      select: {
        id: true,
        employeeId: true,
        roleId: true,
        role: {
          select: {
            name: true,
            lmsPermissions: {
              where: { companyId: user.companyId },
              select: { permission: { select: { code: true } } },
            },
          },
        },
      },
    });

    // Fallback: any company (handles companyId mismatch edge case)
    if (!appUser) {
      appUser = await prisma.appUser.findFirst({
        where: {
          email: { equals: user.email, mode: 'insensitive' },
          isActive: true,
        },
        select: {
          id: true,
          employeeId: true,
          roleId: true,
          role: {
            select: {
              name: true,
              lmsPermissions: {
                select: { permission: { select: { code: true } } },
              },
            },
          },
        },
      });
    }

    // ── 2. Resolve the correct LMS AppRole using name-first strategy ─────
    const jwtRoleName = (user.role || '').trim();
    const jwtRoleId   = String(user.roleId ?? '').trim();

    const resolvedRoleId = await resolveAppRole(
      prisma,
      user.companyId,
      jwtRoleName,
      jwtRoleId,
      appUser?.roleId ?? null,
    );

    // ── 3. Resolve Employee record ───────────────────────────────────────
    let resolvedEmployeeId: string | null = null;

    if (user.userId) {
      const empById = await prisma.employee.findFirst({
        where: { id: { equals: user.userId, mode: 'insensitive' } },
      });
      if (empById) resolvedEmployeeId = empById.id;
    }

    if (!resolvedEmployeeId && user.email) {
      const empByEmail = await prisma.employee.findFirst({
        where: {
          appUsers: { some: { email: { equals: user.email, mode: 'insensitive' } } },
        },
      });
      if (empByEmail) resolvedEmployeeId = empByEmail.id;
    }

    // ── 4. Create AppUser if first login, or update if role/employee changed
    if (!appUser && user.email) {
      try {
        const maxAppUser = await prisma.appUser.findFirst({
          orderBy: { id: 'desc' },
          select: { id: true },
        });
        const nextId = (maxAppUser?.id ?? 1000) + 1;

        let company = await prisma.company.findFirst({ where: { id: user.companyId } });
        if (!company) company = await prisma.company.findFirst();
        const validCompanyId = company?.id ?? user.companyId ?? 1;

        const created = await prisma.appUser.create({
          data: {
            id: nextId,
            companyId: validCompanyId,
            email: user.email,
            roleId: resolvedRoleId,
            employeeId: resolvedEmployeeId,
            isActive: true,
            lastSyncedAt: new Date(),
          },
          select: {
            id: true,
            employeeId: true,
            roleId: true,
            role: {
              select: {
                name: true,
                lmsPermissions: {
                  select: { permission: { select: { code: true } } },
                },
              },
            },
          },
        });

        appUser = created;
        logger.info(
          `[AuthMiddleware] Auto-provisioned AppUser id=${created.id} email=${user.email} roleName=${jwtRoleName}`
        );
      } catch (createErr) {
        logger.warn('[AuthMiddleware] Failed to auto-provision AppUser:', createErr);
      }
    } else if (appUser) {
      const needsRoleUpdate = resolvedRoleId !== null && appUser.roleId !== resolvedRoleId;
      const needsEmpUpdate  = resolvedEmployeeId !== null && appUser.employeeId !== resolvedEmployeeId;

      if (needsRoleUpdate || needsEmpUpdate) {
        try {
          const updateData: { roleId?: number; employeeId?: string; lastSyncedAt: Date } = {
            lastSyncedAt: new Date(),
          };
          if (needsRoleUpdate && resolvedRoleId !== null) updateData.roleId = resolvedRoleId;
          if (needsEmpUpdate  && resolvedEmployeeId !== null) updateData.employeeId = resolvedEmployeeId;

          const updated = await prisma.appUser.update({
            where: { id: appUser.id },
            data: updateData,
            select: {
              id: true,
              employeeId: true,
              roleId: true,
              role: {
                select: {
                  name: true,
                  lmsPermissions: {
                    select: { permission: { select: { code: true } } },
                  },
                },
              },
            },
          });
          appUser = updated;
          logger.info(
            `[AuthMiddleware] Updated AppUser id=${appUser.id} roleName=${jwtRoleName}`
          );
        } catch (updateErr) {
          logger.warn('[AuthMiddleware] Failed to update AppUser:', updateErr);
        }
      }
    }

    // ── 5. Populate CurrentUser from resolved AppUser ────────────────────
    if (appUser) {
      user.appUserId  = appUser.id;
      user.appRoleId  = appUser.roleId ?? undefined;
      user.employeeId = appUser.employeeId ?? undefined;

      // Build permission set — union of primary role + all active UserRoleAssignments
      const primaryPerms = appUser.role?.lmsPermissions.map(rp => rp.permission.code) ?? [];
      let extraPerms: string[] = [];

      try {
        const assignments = await prisma.userRoleAssignment.findMany({
          where: {
            userId:   appUser.id,
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          select: {
            appRole: {
              select: {
                lmsPermissions: {
                  where: { companyId: user.companyId },
                  select: { permission: { select: { code: true } } },
                },
              },
            },
          },
        });
        extraPerms = assignments.flatMap(a =>
          a.appRole.lmsPermissions.map(rp => rp.permission.code)
        );
      } catch {
        // Non-fatal — extra role lookup failure only means extra perms are missing
        logger.warn('[AuthMiddleware] Failed to load UserRoleAssignment permissions');
      }

      const allCodes = new Set([...primaryPerms, ...extraPerms]);
      user.permissions = Array.from(allCodes).sort();

      if (appUser.role?.name) {
        user.roleName = appUser.role.name;
        user.role     = appUser.role.name;
      }
    }

  } catch (err) {
    // Log at ERROR level — this catch silently strips all permissions from the user
    // and causes 403 on every protected route. Always surface these.
    logger.error('[AuthMiddleware] AppUser enrichment FAILED — user will have empty permissions:', err);
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

      const user = baseUserFromToken(tokenPayload);
      await enrichFromAppUser(user);

      req.user      = user as typeof req.user;
      req.sessionId = sessionId;

      logger.debug(
        `[AuthMiddleware] Authenticated userId=${user.userId} role=${user.roleName} appUserId=${user.appUserId ?? 'not synced'}`
      );
      next();
    } catch (error) {
      next(error);
    }
  };
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  new AuthMiddleware(getAuthService()).authenticate(req, res, next);
};
