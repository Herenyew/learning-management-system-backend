// modules/auth/auth.routes.ts
import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { AuthMiddleware } from './auth.middleware.js';

/**
 * Creates and returns the auth routes router.
 *
 * @param controller - AuthController instance
 * @param middleware - AuthMiddleware instance
 * @returns Express Router with auth routes mounted
 */
export function createAuthRoutes(
  controller: AuthController,
  middleware: AuthMiddleware
): Router {
  const router = Router();

  // ─── Public Routes ──────────────────────────────────────────

  /**
   * POST /auth/callback
   * OAuth2 callback handler - exchanges authorization code for session
   * Body: { code: string, redirect_uri?: string }
   */
  router.post('/callback', controller.handleOAuth2Callback);

  // ─── Protected Routes ───────────────────────────────────────

  /**
   * GET /auth/me
   * Get current authenticated user info
   * Requires: lms_session cookie
   */
  router.get('/me', middleware.authenticate, controller.getCurrentUser);

  /**
   * POST /auth/refresh
   * Refresh session tokens
   * Requires: lms_session cookie
   */
  router.post('/refresh', middleware.authenticate, controller.refreshSession);

  /**
   * POST /auth/logout
   * Logout and revoke session
   * Requires: lms_session cookie
   */
  router.post('/logout', middleware.authenticate, controller.logout);

  return router;
}