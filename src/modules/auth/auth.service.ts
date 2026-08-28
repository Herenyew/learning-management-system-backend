// modules/auth/auth.service.ts
import { verifyToken } from '../../common/utils/jwt.utils.js';
import { AppError, ErrorCode } from '../../common/errors/index.js';
import { AuthRepository } from './auth.repository.js';
import { CurrentUser, SessionData, TokenPayload } from './auth.types.js';
import { hashToken } from '../../common/utils/crypto.utils.js';
import { requestTokenRefreshRpc } from '../../integration/rpc/clients/token-refresh.rpc.client.js';
import logger from '../../config/logger.js';

// ─── In-memory raw refresh token store ──────────────────────────────────────
// Raw refresh tokens are never stored in the DB (only the SHA-256 hash is).
// They are kept in memory so we can hand them to the Auth service for
// rotation via RabbitMQ RPC.
//
// WARNING: This is per-process. In a multi-replica setup, replace with Redis.
//
export const rawRefreshTokenStore = new Map<string, string>(); // sessionId → rawRefreshToken

export class AuthService {
  constructor(private repository: AuthRepository) {}

  // ─── Authentication ─────────────────────────────────────────

  async authenticate(token: string): Promise<CurrentUser> {
    const payload = verifyToken(token) as TokenPayload;

    const user = await this.repository.findAuthenticatedUser(payload.appUserId ?? Number(payload.userId));

    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive.', 401, ErrorCode.UNAUTHORIZED);
    }

    if (user.companyId !== payload.companyId) {
      throw new AppError('Invalid tenant session.', 401, ErrorCode.UNAUTHORIZED);
    }

    if (!user.employee || !user.employee.isActive) {
      throw new AppError('Associated employee record is inactive.', 401, ErrorCode.UNAUTHORIZED);
    }

    const permissions: string[] = user.role?.lmsPermissions
      ? user.role.lmsPermissions.map((rp) => rp.permission.code)
      : [];

    return {
      userId: payload.userId,
      appUserId: user.id,
      employeeId: user.employee.id,
      companyId: user.companyId,
      email: user.email,
      roleId: payload.roleId ?? String(user.roleId ?? 0),
      role: payload.role ?? "user",
      permissions,
    };
  }

  // ─── Session Management ────────────────────────────────────

  async createSession(sessionData: SessionData) {
    const hashedRefreshToken = hashToken(sessionData.refreshToken);

    const session = await this.repository.createSession({
      ...sessionData,
      hashedRefreshToken,
    });

    // Keep the raw refresh token in memory for RPC refresh calls
    rawRefreshTokenStore.set(session.id, sessionData.refreshToken);

    return session;
  }

  async getSession(sessionId: string) {
    const session = await this.repository.getSessionById(sessionId);
    if (!session) return null;
    if (new Date(session.expiresAt) < new Date()) {
      await this.repository.revokeSession(sessionId);
      rawRefreshTokenStore.delete(sessionId);
      return null;
    }
    return session;
  }

  async revokeSession(sessionId: string) {
    rawRefreshTokenStore.delete(sessionId);
    return this.repository.revokeSession(sessionId);
  }

  async revokeSessionByAuthSessionId(authSessionId: string): Promise<void> {
    const session = await this.repository.getSessionByAuthSessionId(authSessionId);
    if (session) {
      rawRefreshTokenStore.delete(session.id);
      await this.repository.revokeSession(session.id);
      logger.info(`[AuthService] Revoked session ${session.id} via authSessionId ${authSessionId}`);
    }
  }

  // ─── Token Refresh (via RabbitMQ RPC per the integration guide) ────────────

  async refreshTokens(sessionId: string) {
    const session = await this.repository.getSessionById(sessionId);
    if (!session) return null;

    // Raw refresh token must be in memory — if not, session is effectively dead
    const rawRefreshToken = rawRefreshTokenStore.get(sessionId);
    if (!rawRefreshToken) {
      logger.warn(`[AuthService] Raw refresh token not in memory for session ${sessionId} — cannot refresh`);
      return null;
    }

    // Token refresh goes via RabbitMQ RPC, NOT HTTP (per README §5.3)
    const response = await requestTokenRefreshRpc(rawRefreshToken, String(session.companyId));

    if (!response || !response.accessToken) {
      logger.warn(`[AuthService] Token refresh failed for session ${sessionId}`);
      return null;
    }

    // Update the access token stored in the ServiceSession
    await this.repository.updateSessionAccessToken(sessionId, {
      accessToken: response.accessToken,
      accessTokenExpiresAt: response.accessTokenExpiresAt
        ? new Date(response.accessTokenExpiresAt)
        : new Date(Date.now() + 15 * 60 * 1000),
    });

    // If Auth rotated the refresh token too, update in memory
    if (response.refresh_token) {
      rawRefreshTokenStore.set(sessionId, response.refresh_token);
      const newHash = hashToken(response.refresh_token);
      await this.repository.createRefreshToken({
        token: newHash,
        userId: session.userId,
        companyId: session.companyId,
        serviceSessionId: sessionId,
        expiresAt: response.refresh_token_expires_at
          ? new Date(response.refresh_token_expires_at)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
    }

    // Return shape compatible with the controller
    return {
      access_token: response.accessToken,
      access_token_expires_at: response.accessTokenExpiresAt ?? '',
      user_id: session.userId,
      company_id: String(session.companyId),
    };
  }

  async cleanupExpiredSessions() {
    return this.repository.cleanupExpiredSessions();
  }
}
