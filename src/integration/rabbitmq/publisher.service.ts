import rabbitMQ from "./rabbitmq.service.js";
import type { Exchange } from "./exchanges.js";
import type { RoutingKey } from "./routing-keys.js";

class PublisherService {
  publish(
    exchange: Exchange,
    routingKey: RoutingKey,
    payload: unknown
  ): boolean {
    const channel = rabbitMQ.getChannel();

    return channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(payload)),
      {
        persistent: true,
      }
    );
  }
}

export default new PublisherService();