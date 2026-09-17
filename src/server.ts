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
import { userRoleService } from "./modules/configuration/access-control-configuration/user-role.service.js";
import { startRoleSyncConsumer } from "./integration/events/role-sync.consumer.js";
import { startCompletionRewardsScheduler } from "./modules/enrollments/completion-rewards.scheduler.js";
import { startAssessmentAttemptScheduler } from "./modules/assessments/assessment-attempt.scheduler.js";
import { startEmailDeliveryOutboxScheduler } from "./modules/notifications/email-delivery-outbox.scheduler.js";

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

    // Event-driven sync: react to org-side role changes published by EMS.
    // Failures are logged and non-fatal (RabbitMQ may be unavailable in dev).
    await startRoleSyncConsumer();

    server.listen(env.app.port, () => {
      logger.info(
        `LMS Server running on http://localhost:${env.app.port}`
      );

      logger.info(
        `Swagger Documentation: http://localhost:${env.app.port}/docs`
      );

      logger.info(`Environment: ${env.app.nodeEnv}`);
    });

    // Daily sweep: deactivate expired role assignments and notify affected users.
    const DAY_MS = 24 * 60 * 60 * 1000;
    setInterval(() => {
      void userRoleService
        .expireRoleAssignments()
        .then((r) => {
          if (r.expired > 0 && r.userIds && r.userIds.length > 0) {
            logger.info(
              `[RoleExpiryScheduler] Deactivated ${r.expired} expired role assignment(s) for ${r.userIds.length} user(s)`,
            );
          }
        })
        .catch((error) => {
          logger.error("[RoleExpiryScheduler] Failed to expire role assignments", { error });
        });
    }, DAY_MS);
    // Run once on startup too (non-blocking).
    void userRoleService.expireRoleAssignments();

    // Durable completion side effects: certificates and XP awards.
    startCompletionRewardsScheduler();

    // Enforce assessment time limits even when the learner closes the browser.
    startAssessmentAttemptScheduler();

    // Retry provider email delivery from the durable notification outbox.
    startEmailDeliveryOutboxScheduler();
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
