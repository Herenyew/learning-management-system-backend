// modules/auth/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { getAuthHttpClient } from '../../integration/http/auth-http.client.js';
import { AuthService } from './auth.service.js';
import { AuthenticatedRequest } from './auth.types.js';
import { AUTH_CONSTANTS } from './auth.constants.js';
import logger from '../../config/logger.js';

export class AuthController {
  constructor(private authService: AuthService) {}

  // ─── OAuth2 Callback ────────────────────────────────────────

  handleOAuth2Callback = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({
          success: false,
          error: 'Authorization code is required',
        });
      }

      const authClient = getAuthHttpClient();
      const tokenResponse = await authClient.exchangeAuthorizationCode(code);

      if (!tokenResponse.success) {
        return res.status(401).json({
          success: false,
          error: 'Failed to exchange authorization code',
        });
      }

      const session = await this.authService.createSession({
        userId: tokenResponse.user_id,
        companyId: parseInt(String(tokenResponse.company_id)),
        authSessionId: tokenResponse.auth_session_id,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        // The ServiceSession must live as long as the REFRESH token (30d),
        // NOT the short-lived access token (15m). The access-token expiry is
        // verified per request by AuthMiddleware, which transparently refreshes
        // expired tokens. Killing the session on access-token expiry would log
        // users out every ~15 minutes despite the valid refresh token.
        expiresAt: tokenResponse.refresh_token_expires_at
          ? new Date(tokenResponse.refresh_token_expires_at)
          : new Date(Date.now() + AUTH_CONSTANTS.COOKIE_MAX_AGE),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.cookie(AUTH_CONSTANTS.COOKIE_NAME, session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: AUTH_CONSTANTS.COOKIE_MAX_AGE,
        path: '/',
      });

      logger.info(`[AuthController] OAuth2 callback successful for user ${tokenResponse.user_id}`);

      res.status(200).json({
        success: true,
        data: {
          sessionId: session.id,
          userId: tokenResponse.user_id,
          companyId: tokenResponse.company_id,
          email: tokenResponse.email,
          redirect_uri: req.body.redirect_uri || '/dashboard',
        },
      });
    } catch (error) {
      logger.error('[AuthController] OAuth2 callback error', error);
      res.status(500).json({
        success: false,
        error: 'Authentication failed. Please try again.',
      });
    }
  };

  // ─── Get Current User ───────────────────────────────────────

  getCurrentUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
      }

      res.status(200).json({
        success: true,
        data: req.user,
      });
    } catch (error) {
      logger.error('[AuthController] Failed to get current user', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user info',
      });
    }
  };

  // ─── Logout ──────────────────────────────────────────────────

  logout = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (req.sessionId) {
        await this.authService.revokeSession(req.sessionId);
        logger.info(`[AuthController] User ${req.user?.userId} logged out`);
      }

      res.clearCookie(AUTH_CONSTANTS.COOKIE_NAME, { path: '/' });

      res.status(200).json({
        success: true,
        message: 'Successfully logged out',
      });
    } catch (error) {
      logger.error('[AuthController] Logout error', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed',
      });
    }
  };

  // ─── Refresh Session ────────────────────────────────────────

  refreshSession = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.sessionId) {
        return res.status(401).json({
          success: false,
          error: 'Session not found',
        });
      }

      const newSessionData = await this.authService.refreshTokens(req.sessionId);

      if (!newSessionData) {
        return res.status(401).json({
          success: false,
          error: 'Failed to refresh session',
        });
      }

      logger.info(`[AuthController] Session refreshed for user ${newSessionData.user_id}`);

      res.status(200).json({
        success: true,
        data: {
          expiresAt: newSessionData.access_token_expires_at,
        },
      });
    } catch (error) {
      logger.error('[AuthController] Token refresh error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to refresh tokens',
      });
    }
  };
}