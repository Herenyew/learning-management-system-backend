import prisma from "../../../config/database.js";
import { NotificationConfigurationRepository } from "./notification-configuration.repository.js";
import { NotificationConfigurationService } from "./notification-configuration.service.js";
import { NotificationConfigurationController } from "./notification-configuration.controller.js";
import { notificationConfigurationRouter } from "./notification-configuration.routes.js";

// ============================================================================
// 1. Dependency Injection & Wiring
// ============================================================================

  const repository = new NotificationConfigurationRepository(prisma);
  const service = new NotificationConfigurationService(repository);
  const controller = new NotificationConfigurationController(service);
  const router = notificationConfigurationRouter(controller);

export default router;
