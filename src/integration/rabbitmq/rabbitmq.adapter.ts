// integrations/rabbitmq/rabbitmq.adapter.ts
/**
 * RabbitMQ Adapter
 * Manages connection to RabbitMQ broker and sets up consumers/RPC servers
 */

import amqp, { Channel, Replies } from "amqplib";
type Connection = any;
import { Exchanges } from "solarios";
import logger from "../../config/logger.js";

export interface RabbitMQAdapterConfig {
  url: string;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

export class RabbitMQAdapter {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private config: RabbitMQAdapterConfig;
  private reconnectAttempts = 0;
  private isShuttingDown = false;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(config: RabbitMQAdapterConfig) {
    this.config = {
      reconnectDelay: 5000,
      maxReconnectAttempts: 10,
      ...config,
    };
  }

  /**
   * Connect to RabbitMQ broker and establish channel
   */
  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.config.url);
      this.channel = await this.connection.createChannel();
      this.reconnectAttempts = 0;

      // Declare exchanges
      await this.declareExchanges();

      logger.info("[RabbitMQ] Connected and channel created");

      // Handle connection errors
      this.connection?.on("error", (err: any) => {
        logger.error("[RabbitMQ] Connection error", err);
        this.reconnect();
      });

      this.connection?.on("close", () => {
        logger.warn("[RabbitMQ] Connection closed");
        if (!this.isShuttingDown) {
          this.reconnect();
        }
      });
    } catch (error) {
      logger.error("[RabbitMQ] Connection failed", error);
      this.reconnect();
    }
  }

  /**
   * Declare all exchanges used by the LMS
   */
  async declareExchanges(): Promise<void> {
    if (!this.channel) {
      throw new Error("RabbitMQ channel not initialized");
    }

    // Declare LMS exchange
    await this.channel.assertExchange("lms", "topic", { durable: true });

    // Declare Auth exchange (for bindings)
    await this.channel.assertExchange(Exchanges.AUTH, "topic", { durable: true });

    logger.info("[RabbitMQ] Exchanges declared");
  }

  /**
   * Reconnect to RabbitMQ with exponential backoff
   */
  private reconnect(): void {
    if (
      this.isShuttingDown ||
      this.reconnectAttempts >= (this.config.maxReconnectAttempts || 10)
    ) {
      logger.error("[RabbitMQ] Max reconnection attempts reached. Giving up.");
      return;
    }

    this.reconnectAttempts++;
    const delay = (this.config.reconnectDelay || 5000) * Math.pow(2, this.reconnectAttempts - 1);

    logger.info(
      `[RabbitMQ] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`
    );

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Get channel (ensure connected first)
   */
  getChannel(): Channel {
    if (!this.channel) {
      throw new Error("RabbitMQ channel not initialized. Call connect() first.");
    }
    return this.channel;
  }

  /**
   * Assert exchange
   */
  async assertExchange(
    exchange: string,
    type: "topic" | "direct" = "topic"
  ): Promise<Replies.AssertExchange> {
    const ch = this.getChannel();
    return ch.assertExchange(exchange, type, { durable: true });
  }

  /**
   * Assert queue
   */
  async assertQueue(
    queue: string,
    options?: amqp.Options.AssertQueue
  ): Promise<Replies.AssertQueue> {
    const ch = this.getChannel();
    return ch.assertQueue(queue, { durable: true, ...options });
  }

  /**
   * Bind queue to exchange with routing key
   */
  async bindQueue(
    queue: string,
    exchange: string,
    routingKey: string
  ): Promise<void> {
    const ch = this.getChannel();
    await ch.bindQueue(queue, exchange, routingKey);
  }

  /**
   * Publish message to exchange
   */
  async publish(exchange: string, routingKey: string, message: any): Promise<boolean> {
    const ch = this.getChannel();
    const buffer = Buffer.from(JSON.stringify(message));
    return ch.publish(exchange, routingKey, buffer, { persistent: true });
  }

  /**
   * Consume messages from queue with callback
   */
  async consume(
    queue: string,
    onMessage: (msg: any) => Promise<void>
  ): Promise<void> {
    const ch = this.getChannel();
    await ch.consume(queue, async (msg) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString());
        await onMessage(content);
        ch.ack(msg);
      } catch (error) {
        logger.error(`[RabbitMQ] Error processing message from ${queue}:`, error);
        ch.nack(msg, false, true);
      }
    });

    logger.info(`[RabbitMQ] Consuming messages from ${queue}`);
  }

  /**
   * Gracefully close connection
   */
  async disconnect(): Promise<void> {
    this.isShuttingDown = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      logger.info("[RabbitMQ] Gracefully disconnected");
    } catch (error) {
      logger.error("[RabbitMQ] Error during disconnect", error);
    }
  }
}

// ─── Singleton instance ─────────────────────────────────────────────────────

let adapter: RabbitMQAdapter | null = null;

export function getRabbitMQAdapter(config?: RabbitMQAdapterConfig): RabbitMQAdapter {
  if (!adapter) {
    if (!config) {
      throw new Error(
        "RabbitMQ adapter not initialized. Call getRabbitMQAdapter(config) with config first."
      );
    }
    adapter = new RabbitMQAdapter(config);
  }
  return adapter;
}