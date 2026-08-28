// integration/rabbitmq/rabbitmq.service.ts
import amqp from "amqplib";
import logger from "../../config/logger.js";
import { Exchanges } from "solarios";

class RabbitMQService {
  private connection?: Awaited<ReturnType<typeof amqp.connect>>;
  private channel?: Awaited<
    ReturnType<Awaited<ReturnType<typeof amqp.connect>>["createChannel"]>
  >;
  private isConnected = false;

  async connect(url: string): Promise<void> {
    try {
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      this.isConnected = true;

      // Declare exchanges
      await this.declareExchanges();

      logger.info("[RabbitMQ] Connected and exchanges declared");
    } catch (error) {
      logger.error("[RabbitMQ] Connection failed", error);
      throw error;
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

    // Also ensure auth exchange exists for bindings
    await this.channel.assertExchange(Exchanges.AUTH, "topic", { durable: true });

    // Declare any other exchanges your LMS needs
    // await this.channel.assertExchange(Exchanges.EDM, "topic", { durable: true });

    logger.info("[RabbitMQ] Exchanges declared");
  }

  /**                           
   * Assert a queue
   */
  async assertQueue(queue: string, options?: amqp.Options.AssertQueue): Promise<amqp.Replies.AssertQueue> {
    if (!this.channel) {
      throw new Error("RabbitMQ channel not initialized");
    }
    return this.channel.assertQueue(queue, { durable: true, ...options });
  }

  /**
   * Bind a queue to an exchange with a routing key
   */
  async bindQueue(queue: string, exchange: string, routingKey: string): Promise<void> {
    if (!this.channel) {
      throw new Error("RabbitMQ channel not initialized");
    }
    await this.channel.bindQueue(queue, exchange, routingKey);
    logger.debug(`[RabbitMQ] Bound queue ${queue} to ${exchange} with ${routingKey}`);
  }

  /**
   * Publish a message to an exchange
   */
  async publish(exchange: string, routingKey: string, message: any): Promise<boolean> {
    if (!this.channel) {
      throw new Error("RabbitMQ channel not initialized");
    }
    const buffer = Buffer.from(JSON.stringify(message));
    return this.channel.publish(exchange, routingKey, buffer, { persistent: true });
  }

  getChannel() {
    if (!this.channel) {
      throw new Error("RabbitMQ is not initialized.");
    }
    return this.channel;
  }

  get isConnectedToRabbitMQ(): boolean {
    return this.isConnected;
  }

  async disconnect() {
    try {
      await this.channel?.close();
      await this.connection?.close();
      this.isConnected = false;
      logger.info("[RabbitMQ] Disconnected");
    } catch (error) {
      logger.error("[RabbitMQ] Error during disconnect", error);
    }
  }
}

export default new RabbitMQService();