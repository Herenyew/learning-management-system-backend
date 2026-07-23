import amqp from "amqplib";
import logger from "../../config/logger.js";
import { Exchanges } from "./exchanges.js";

class RabbitMQService {
  private connection?: Awaited<ReturnType<typeof amqp.connect>>;
  private channel?: Awaited<
    ReturnType<Awaited<ReturnType<typeof amqp.connect>>["createChannel"]>
  >;

  async connect(url: string): Promise<void> {
    this.connection = await amqp.connect(url);

    this.channel = await this.connection.createChannel();

    await this.channel.assertExchange(
      Exchanges.EMS,
      "topic",
      { durable: true }
    );

    await this.channel.assertExchange(
      Exchanges.LMS,
      "topic",
      { durable: true }
    );

    logger.info("RabbitMQ connected.");
  }

  getChannel() {
    if (!this.channel) {
      throw new Error("RabbitMQ is not initialized.");
    }

    return this.channel;
  }

  async disconnect() {
    await this.channel?.close();
    await this.connection?.close();

    logger.info("RabbitMQ disconnected.");
  }
}

export default new RabbitMQService();