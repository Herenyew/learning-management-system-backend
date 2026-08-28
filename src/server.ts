import http from "node:http";

import app from "./app.js";

import logger from "./config/logger.js";
import { env } from "./config/env.js";
import {
  connectDatabase,
  disconnectDatabase,
} from "./config/database.js";
import { bootstrapAuth } from "./common/bootstrap/auth.bootstrap.js";
import { getRabbitMQAdapter } from "./integration/rabbitmq/rabbitmq.adapter.js";

const server = http.createServer(app);

async function bootstrap(): Promise<void> {
  try {
    // Connect Infrastructure
    await connectDatabase();

    // Initialize authentication subsystem
    await bootstrapAuth({
      rabbitmqUrl: env.rabbitmq.url,
      authServiceUrl: env.auth.serviceUrl,
      authClientId: env.auth.clientId,
      authClientSecret: env.auth.clientSecret,
      jwtSecret: env.jwt.secret,
    });

    server.listen(env.app.port, () => {
      logger.info(
        `LMS Server running on http://localhost:${env.app.port}`
      );

      logger.info(
        `Swagger Documentation: http://localhost:${env.app.port}/docs`
      );

      logger.info(`Environment: ${env.app.nodeEnv}`);
    });
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
}

bootstrap();

async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} received. Shutting down...`);

  server.close(async () => {
    try {
      await disconnectDatabase();

      // Disconnect RabbitMQ
      const rabbitmqAdapter = getRabbitMQAdapter();
      await rabbitmqAdapter.disconnect();

      logger.info("Server stopped successfully.");

      process.exit(0);
    } catch (error) {
      logger.error(error);
      process.exit(1);
    }
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));