/**
 * Token Refresh RPC Client
 *
 * Per the integration guide, token refresh MUST go via RabbitMQ RPC
 * (queue: rpc.auth.token.refresh.request), NOT via HTTP.
 *
 * Pattern: send request with correlationId + replyTo, await reply on
 * a temporary exclusive queue, with a 10-second timeout.
 */

import { v4 as uuidv4 } from 'uuid';
import { RABBITMQ_DEFAULTS, QueueNames } from 'solarios';
import { getRabbitMQAdapter } from '../../rabbitmq/rabbitmq.adapter.js';
import logger from '../../../config/logger.js';

export interface TokenRefreshRequest {
  refreshToken: string;
  companyId: string;
}

export interface TokenRefreshResponse {
  success: boolean;
  accessToken?: string;
  accessTokenExpiresAt?: string;
  refresh_token?: string;
  refresh_token_expires_at?: string;
  user_id?: string;
  company_id?: string;
  error?: string;
}

const REQUEST_QUEUE = QueueNames.rpc.tokenRefresh.request;
// = "rpc.auth.token.refresh.request"

/**
 * Requests a new access token from Auth Service via RabbitMQ RPC.
 *
 * Returns the refresh response if successful, null if the token is
 * invalid or the request times out.
 */
export async function requestTokenRefreshRpc(
  rawRefreshToken: string,
  companyId: string | number
): Promise<TokenRefreshResponse | null> {
  const adapter = getRabbitMQAdapter();

  let channel: ReturnType<typeof adapter.getChannel>;
  try {
    channel = adapter.getChannel();
  } catch {
    logger.warn('[TokenRefreshRPC] RabbitMQ channel not available — skipping RPC refresh');
    return null;
  }

  const correlationId = uuidv4();

  // Create a temporary, exclusive reply queue
  const { queue: replyQueue } = await channel.assertQueue('', {
    exclusive: true,
    autoDelete: true,
  });

  logger.debug(`[TokenRefreshRPC] Sending token refresh request correlationId=${correlationId}`);

  return new Promise<TokenRefreshResponse | null>((resolve) => {
    const timeout = setTimeout(() => {
      logger.error(`[TokenRefreshRPC] Timed out waiting for Auth reply correlationId=${correlationId}`);
      resolve(null);
    }, RABBITMQ_DEFAULTS.RPC_TIMEOUT_MS);

    channel.consume(
      replyQueue,
      (msg) => {
        if (!msg) return;
        if (msg.properties.correlationId !== correlationId) return;

        clearTimeout(timeout);
        channel.ack(msg);

        const response = JSON.parse(msg.content.toString()) as TokenRefreshResponse;

        logger.debug(`[TokenRefreshRPC] Received response success=${response.success} correlationId=${correlationId}`);

        resolve(response.success ? response : null);
      },
      { noAck: false }
    );

    const request: TokenRefreshRequest = {
      refreshToken: rawRefreshToken,
      companyId: String(companyId),
    };

    channel.sendToQueue(
      REQUEST_QUEUE,
      Buffer.from(JSON.stringify(request)),
      {
        correlationId,
        replyTo: replyQueue,
        persistent: false,
        expiration: String(RABBITMQ_DEFAULTS.RPC_TIMEOUT_MS),
      }
    );

    logger.debug(`[TokenRefreshRPC] Request sent to queue=${REQUEST_QUEUE} correlationId=${correlationId}`);
  });
}
