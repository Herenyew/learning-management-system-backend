import rabbitMQ from "./rabbitmq.service.js";
import type { Queue } from "./queues.js";

class ConsumerService {
  async subscribe(
    queue: Queue,
    handler: (message: unknown) => Promise<void>
  ): Promise<void> {
    const channel = rabbitMQ.getChannel();

    await channel.assertQueue(queue, {
      durable: true,
    });

    channel.consume(queue, async (msg) => {
      if (!msg) return;

      try {
        const payload = JSON.parse(msg.content.toString());

        await handler(payload);

        channel.ack(msg);
      } catch (error) {
        channel.nack(msg, false, false);
      }
    });
  }
}

export default new ConsumerService();