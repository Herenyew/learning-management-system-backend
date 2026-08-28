// modules/auth/auth.repository.ts
import { PrismaClient } from '@prisma/client';
import { SessionData } from './auth.types.js';

export class AuthRepository {
  constructor(private prisma: PrismaClient) {}

  // ─── User Lookup ───────────────────────────────────────────

  async findAuthenticatedUser(appUserId: number) {
    const baseUser = await this.prisma.appUser.findFirst({
      where: { id: appUserId },
      select: { companyId: true },
    });

    if (!baseUser) return null;

    return this.prisma.appUser.findFirst({
      where: { id: appUserId },
      select: {
        id: true,
        email: true,
        companyId: true,
        roleId: true,
        isActive: true,
        employee: {
          select: {
            id: true,
            isActive: true,
          },
        },
        role: {
          select: {
            id: true,
            lmsPermissions: {
              where: {
                companyId: baseUser.companyId,
              },
              select: {
                permission: {
                  select: {
                    code: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find LMS AppUser projection by email + companyId.
   * Used to enrich the session with appUserId and permissions after SSO login.
   * Returns null if the user hasn't been synced from EDM yet.
   */
  async findAppUserByEmail(email: string, companyId: number) {
    return this.prisma.appUser.findFirst({
      where: { email, companyId, isActive: true },
      select: {
        id: true,
        email: true,
        companyId: true,
        roleId: true,
        employeeId: true,
        isActive: true,
        role: {
          select: {
            id: true,
            lmsPermissions: {
              where: { companyId },
              select: {
                permission: { select: { code: true } },
              },
            },
          },
        },
      },
    });
  }

  // ─── Session Management ────────────────────────────────────

  async createSession(data: SessionData & { hashedRefreshToken: string }) {
    return this.prisma.serviceSession.create({
      data: {
        userId: data.userId,
        companyId: data.companyId,
        authSessionId: data.authSessionId,
        accessToken: data.accessToken,
        refreshToken: data.hashedRefreshToken,
        expiresAt: data.expiresAt,
      },
    });
  }

  async getSessionById(sessionId: string) {
    return this.prisma.serviceSession.findUnique({
      where: { id: sessionId, isActive: true },
    });
  }

  async getSessionByUser(userId: string, companyId: number) {
    return this.prisma.serviceSession.findFirst({
      where: {
        userId,
        companyId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Finds an active session by its Auth Service session ID.
   * Used during session revocation events from RabbitMQ.
   */
  async getSessionByAuthSessionId(authSessionId: string) {
    return this.prisma.serviceSession.findFirst({
      where: { authSessionId, isActive: true },
    });
  }

  async updateSessionAccessToken(
    sessionId: string,
    data: { accessToken: string; accessTokenExpiresAt: Date }
  ) {
    return this.prisma.serviceSession.update({
      where: { id: sessionId },
      data: {
        accessToken: data.accessToken,
        // Do NOT overwrite expiresAt here — the session row's expiresAt is the
        // refresh-token (session) lifetime set at login. expiresAt tracks when
        // the access token expires; overwriting it would kill the session at
        // the next access-token expiry (~15 min) instead of allowing a refresh.
        updatedAt: new Date(),
      },
    });
  }

  async revokeSession(sessionId: string) {
    return this.prisma.serviceSession.update({
      where: { id: sessionId },
      data: { isActive: false },
    });
  }

  async revokeAllSessions(userId: string, companyId: number) {
    return this.prisma.serviceSession.updateMany({
      where: { userId, companyId, isActive: true },
      data: { isActive: false },
    });
  }

  async cleanupExpiredSessions() {
    return this.prisma.serviceSession.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }

  // ─── Refresh Token Management ──────────────────────────────

  async createRefreshToken(data: {
    token: string;
    userId: string;
    companyId: number;
    serviceSessionId: string;
    expiresAt: Date;
  }) {
    return this.prisma.refreshToken.create({
      data: {
        token: data.token,
        userId: data.userId,
        companyId: data.companyId,
        serviceSessionId: data.serviceSessionId,
        expiresAt: data.expiresAt,
      },
    });
  }

  async getRefreshToken(serviceSessionId: string) {
    return this.prisma.refreshToken.findFirst({
      where: {
        serviceSessionId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async revokeRefreshToken(id: string) {
    return this.prisma.refreshToken.update({
      where: { id },
      data: { isRevoked: true },
    });
  }
}
