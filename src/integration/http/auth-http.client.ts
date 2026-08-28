/**
 * Auth HTTP Client
 * Communicates with Auth Service via HTTP for OAuth2 code exchange.
 *
 * IMPORTANT — Auth Service response envelope:
 *   All success responses are wrapped as { success: true, data: { ...payload } }
 *   This client unwraps the envelope so callers receive the flat payload directly.
 */

import axios, { AxiosInstance } from "axios";
import logger from "../../config/logger.js";

// ─── Response envelope ────────────────────────────────────────────────────────

interface AuthApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { message: string };
}

// ─── Payload shapes (the inner `data` object) ─────────────────────────────────

export interface TokenExchangePayload {
  access_token: string;
  refresh_token: string;
  access_token_expires_at: string;
  refresh_token_expires_at: string;
  user_id: string;
  company_id: string;
  auth_session_id: string;
  email?: string;
  company_code?: string;
  company_name?: string;
  logo_url?: string | null;
  primary_color?: string;
  secondary_color?: string;
}

// What callers (auth.controller.ts) receive after unwrapping
export interface TokenExchangeResponse extends TokenExchangePayload {
  success: true;
}

export interface UserInfoResponse {
  success: true;
  data: {
    userId: string;
    email: string;
    companyId: number;
    companyCode: string;
    companyName: string;
    logoUrl?: string;
    role: string;
    roleId: string;
    enabled_modules: string[];
    sessionId: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class AuthHttpClient {
  private client: AxiosInstance;
  private clientId: string;
  private clientSecret: string;

  constructor(baseUrl: string, clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;

    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
      headers: { "Content-Type": "application/json" },
    });

    this.client.interceptors.request.use((config) => {
      logger.info(`[AuthHttpClient] ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    this.client.interceptors.response.use(
      (response) => {
        logger.info(
          `[AuthHttpClient] Response: ${response.status} from ${response.config.url}`
        );
        return response;
      },
      (error) => {
        logger.error(
          `[AuthHttpClient] Error: ${error.response?.status} from ${error.config?.url} — ${error.message}`
        );
        throw error;
      }
    );
  }

  /**
   * Exchange authorization code for tokens.
   * POST /api/v1/auth/token/exchange
   *
   * Auth service returns { success, data: { access_token, ... } }.
   * This method unwraps the envelope and returns the flat payload.
   */
  async exchangeAuthorizationCode(code: string): Promise<TokenExchangeResponse> {
    const response = await this.client.post<AuthApiEnvelope<TokenExchangePayload>>(
      "/api/v1/auth/token/exchange",
      {
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }
    );

    const envelope = response.data;

    if (!envelope.success || !envelope.data) {
      const msg = envelope.error?.message ?? "Token exchange failed";
      logger.error(`[AuthHttpClient] Token exchange rejected by auth service: ${msg}`);
      const err = new Error(msg) as any;
      err.code = msg; // preserve error codes like "invalid_code", "invalid_client"
      throw err;
    }

    // Unwrap: return the flat payload with success=true merged in
    return { success: true, ...envelope.data };
  }

  /**
   * Get current user info from auth service.
   * GET /api/v1/auth/validate  (auth service uses /validate, not /me)
   */
  async getUserInfo(accessToken: string): Promise<UserInfoResponse> {
    const response = await this.client.get<UserInfoResponse>(
      "/api/v1/auth/validate",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return response.data;
  }

  /**
   * Refresh access token via RabbitMQ RPC (preferred) or HTTP fallback.
   * POST /api/v1/auth/refresh
   */
  async refreshToken(refreshToken: string): Promise<TokenExchangeResponse> {
    const response = await this.client.post<AuthApiEnvelope<TokenExchangePayload>>(
      "/api/v1/auth/refresh",
      {
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }
    );

    const envelope = response.data;
    if (!envelope.success || !envelope.data) {
      throw new Error(envelope.error?.message ?? "Token refresh failed");
    }
    return { success: true, ...envelope.data };
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let authHttpClient: AuthHttpClient | null = null;

export function initializeAuthHttpClient(
  baseUrl: string,
  clientId: string,
  clientSecret: string
): AuthHttpClient {
  authHttpClient = new AuthHttpClient(baseUrl, clientId, clientSecret);
  return authHttpClient;
}

export function getAuthHttpClient(): AuthHttpClient {
  if (!authHttpClient) {
    throw new Error("AuthHttpClient not initialized. Call initializeAuthHttpClient() first.");
  }
  return authHttpClient;
}
