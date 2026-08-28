// common/bootstrap/auth.bootstrap.ts
import { Exchanges, RoutingKeys, RABBITMQ_DEFAULTS } from 'solarios';
import { getRabbitMQAdapter } from '../../integration/rabbitmq/rabbitmq.adapter.js';
import { initializeAuthHttpClient } from '../../integration/http/auth-http.client.js';
import { setupSessionRevocationConsumer } from '../../integration/events/consumers/session-revocation.consumer.js';
import { AuthService } from '../../modules/auth/auth.service.js';
import { AuthRepository } from '../../modules/auth/auth.repository.js';
import { getPrismaClient } from '../../config/database.js';
import logger from '../../config/logger.js';

export interface AuthBootstrapConfig {
  rabbitmqUrl: string;
  authServiceUrl: string;
  authClientId: string;
  authClientSecret: string;
  jwtSecret: string;
}

// ─── Singleton instances ─────────────────────────────────────

let authServiceInstance: AuthService | null = null;
let authRepositoryInstance: AuthRepository | null = null;
let cleanupInterval: NodeJS.Timeout | null = null;

// ─── Getters ──────────────────────────────────────────────────

export function getAuthService(): AuthService {
  if (!authServiceInstance) {
    throw new Error('AuthService not initialized. Call bootstrapAuth() first.');
  }
  return authServiceInstance;
}

export function getAuthRepository(): AuthRepository {
  if (!authRepositoryInstance) {
    throw new Error('AuthRepository not initialized. Call bootstrapAuth() first.');
  }
  return authRepositoryInstance;
}

/**
 * Declare LMS exchanges and queues, then start consumers.
 * Called once the RabbitMQ channel is available (after connect()).
 */
async function setupRabbitMQTopology(): Promise<void> {
  const adapter = getRabbitMQAdapter();
  try {
    const channel = adapter.getChannel();

    // Declare the LMS exchange (for future LMS-originated events)
    await channel.assertExchange('lms', RABBITMQ_DEFAULTS.EXCHANGE_TYPE, {
      ...RABBITMQ_DEFAULTS.EXCHANGE_OPTIONS,
    });

    // Declare the Auth exchange (so we can bind to it for session.revoked)
    await channel.assertExchange(Exchanges.AUTH, RABBITMQ_DEFAULTS.EXCHANGE_TYPE, {
      ...RABBITMQ_DEFAULTS.EXCHANGE_OPTIONS,
    });

    logger.info('[AuthBootstrap] RabbitMQ exchanges declared: lms, ' + Exchanges.AUTH);

    // Set up event consumers (binds queues and starts listening)
    await setupSessionRevocationConsumer();
    logger.info('[AuthBootstrap] Event consumers setup complete');
  } catch (error) {
    logger.warn(
      '[AuthBootstrap] RabbitMQ topology setup skipped (broker not ready yet). Will retry when connection is established.',
      error
    );
  }
}

/**
 * Bootstrap authentication subsystem.
 * The HTTP server starts regardless of RabbitMQ availability;
 * the broker connection retries in the background.
 */
export async function bootstrapAuth(config: AuthBootstrapConfig): Promise<void> {
  try {
    logger.info('[AuthBootstrap] Starting authentication bootstrap...');

    // ─── 1. Begin RabbitMQ connection (non-blocking) ─────────────────────
    // connect() handles its own reconnect loop internally. We fire it and
    // don't await it so the HTTP server can start even if RabbitMQ is down.

    logger.info('[AuthBootstrap] Connecting to RabbitMQ...');
    const rabbitmqAdapter = getRabbitMQAdapter({ url: config.rabbitmqUrl });

    rabbitmqAdapter.connect().then(() => {
      setupRabbitMQTopology().catch((err) =>
        logger.error('[AuthBootstrap] Failed to setup RabbitMQ topology after connect', err)
      );
    }).catch(() => {
      // connect() already logs and schedules reconnect internally; swallow here.
    });

    // ─── 2. Initialize Auth HTTP client ──────────────────────────────────

    logger.info('[AuthBootstrap] Initializing Auth HTTP client...');
    initializeAuthHttpClient(
      config.authServiceUrl,
      config.authClientId,
      config.authClientSecret
    );
    logger.info('[AuthBootstrap] Auth HTTP client initialized');

    // ─── 3. Initialize Repository and Service ────────────────────────────

    logger.info('[AuthBootstrap] Initializing Auth repository and service...');
    const prisma = getPrismaClient();
    authRepositoryInstance = new AuthRepository(prisma);
    authServiceInstance = new AuthService(authRepositoryInstance);
    logger.info('[AuthBootstrap] Auth service initialized');

    // ─── 4. Periodic cleanup of expired sessions ─────────────────────────

    logger.info('[AuthBootstrap] Setting up periodic session cleanup...');

    if (cleanupInterval) {
      clearInterval(cleanupInterval);
    }

    cleanupInterval = setInterval(async () => {
      try {
        const result = await getAuthService().cleanupExpiredSessions();
        if (result.count > 0) {
          logger.info(`[AuthBootstrap] Cleaned up ${result.count} expired sessions`);
        }
      } catch (error) {
        logger.error('[AuthBootstrap] Error during session cleanup', error);
      }
    }, 60 * 60 * 1000); // 1 hour

    logger.info('[AuthBootstrap] Authentication bootstrap complete');
  } catch (error) {
    logger.error('[AuthBootstrap] Bootstrap failed', error);
    throw error;
  }
}

/**
 * Gracefully shutdown authentication subsystem
 */
export async function shutdownAuth(): Promise<void> {
  logger.info('[AuthBootstrap] Shutting down authentication subsystem...');

  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }

  try {
    const rabbitmqAdapter = getRabbitMQAdapter();
    await rabbitmqAdapter.disconnect();
  } catch {
    // adapter may not have been initialized yet
  }

  authServiceInstance = null;
  authRepositoryInstance = null;

  logger.info('[AuthBootstrap] Shutdown complete');
}
