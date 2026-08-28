/**
 * Session Revocation Consumer
 *
 * Listens for auth.session.revoked events from the Auth exchange.
 * When received, deactivates the matching LMS ServiceSession so the
 * user can no longer make authenticated requests with that session.
 *
 * Per the integration guide (§5.4):
 *   - Queue: q.lms.session.revoked  (unique per service)
 *   - Exchange: Exchanges.AUTH       = "auth"
 *   - Routing key: RoutingKeys.auth.sessionRevoked = "auth.session.revoked"
 */

import { Exchanges, RoutingKeys, RABBITMQ_DEFAULTS } from 'solarios';
import type { ConsumeMessage } from 'amqplib';
import { getRabbitMQAdapter } from '../../rabbitmq/rabbitmq.adapter.js';
import { getAuthService } from '../../../common/bootstrap/auth.bootstrap.js';
import logger from '../../../config/logger.js';

export interface SessionRevokedEvent {
  userId: string;
  companyId: number;
  authSessionId: string;  // matched against ServiceSession.authSessionId
  revokedAt?: string;
  timestamp?: string;
}

const QUEUE_NAME = 'q.lms.session.revoked';

/**
 * Sets up the session revocation consumer.
 * Must be called after RabbitMQ is connected and exchanges are declared.
 */
export async function setupSessionRevocationConsumer(): Promise<void> {
  const adapter = getRabbitMQAdapter();
  const channel = adapter.getChannel();

  // Assert the queue
  await channel.assertQueue(QUEUE_NAME, {
    ...RABBITMQ_DEFAULTS.QUEUE_OPTIONS, // { durable: true }
  });

  // Bind to the Auth exchange with the session.revoked routing key
  await channel.bindQueue(
    QUEUE_NAME,
    Exchanges.AUTH,                   // "auth"
    RoutingKeys.auth.sessionRevoked   // "auth.session.revoked"
  );

  await channel.prefetch(RABBITMQ_DEFAULTS.PREFETCH_COUNT);

  channel.consume(
    QUEUE_NAME,
    async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      try {
        const event = JSON.parse(msg.content.toString()) as SessionRevokedEvent;

        logger.info(
          `[SessionRevocationConsumer] Received revocation for authSessionId=${event.authSessionId} userId=${event.userId}`
        );

        // Find the LMS session that corresponds to this Auth session and revoke it
        const authService = getAuthService();
        await authService.revokeSessionByAuthSessionId(event.authSessionId);

        channel.ack(msg);

        logger.info(
          `[SessionRevocationConsumer] Successfully processed revocation for authSessionId=${event.authSessionId}`
        );
      } catch (error) {
        logger.error('[SessionRevocationConsumer] Failed to process revocation event', error);
        // nack without requeue to avoid poison-pill loops
        channel.nack(msg, false, false);
      }
    },
    { noAck: false }
  );

  logger.info(`[SessionRevocationConsumer] Listening on ${QUEUE_NAME} → ${Exchanges.AUTH}/${RoutingKeys.auth.sessionRevoked}`);
}
