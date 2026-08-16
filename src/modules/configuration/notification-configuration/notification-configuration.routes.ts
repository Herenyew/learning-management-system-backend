import { Router } from "express";
import { NotificationConfigurationController } from "./notification-configuration.controller.js";
import { validateBody, validateQuery } from "../../../common/middlewares/validation.middleware.js";
import { authenticate } from "../../../common/auth/auth.middleware.js";
import { requirePermission } from "../../../common/auth/permission.middleware.js";
import { Permissions } from "../../../common/constants/permission.constant.js";

import {
  createNotificationModuleSchema,
  updateNotificationModuleSchema,
  notificationModuleFilterSchema,
  createNotificationEventSchema,
  updateNotificationEventSchema,
  notificationEventFilterSchema,
  createNotificationTemplateSchema,
  updateNotificationTemplateSchema,
  notificationTemplateFilterSchema,
} from "./notification-configuration.dto.js";

export function notificationConfigurationRouter(
  controller: NotificationConfigurationController
): Router {
  const router = Router();

  router.use(authenticate);

  // ==========================================
  // 1. NotificationModule Routes
  // ==========================================
  router.post(
    "/modules",
    requirePermission(Permissions.NOTIFICATION_MODULE_CREATE),
    validateBody(createNotificationModuleSchema),
    controller.createNotificationModule
  );

  router.get(
    "/modules",
    requirePermission(Permissions.NOTIFICATION_MODULE_VIEW),
    validateQuery(notificationModuleFilterSchema),
    controller.listNotificationModules
  );

  router.get(
    "/modules/:id",
    requirePermission(Permissions.NOTIFICATION_MODULE_VIEW),
    controller.getNotificationModuleById
  );

  router.patch(
    "/modules/:id",
    requirePermission(Permissions.NOTIFICATION_MODULE_UPDATE),
    validateBody(updateNotificationModuleSchema),
    controller.updateNotificationModule
  );

  router.patch(
    "/modules/:id/deactivate",
    requirePermission(Permissions.NOTIFICATION_MODULE_UPDATE),
    controller.deactivateNotificationModule
  );

  // ==========================================
  // 2. NotificationEvent Routes
  // ==========================================
  router.post(
    "/events",
    requirePermission(Permissions.NOTIFICATION_EVENT_CREATE),
    validateBody(createNotificationEventSchema),
    controller.createNotificationEvent
  );

  router.get(
    "/events",
    requirePermission(Permissions.NOTIFICATION_EVENT_VIEW),
    validateQuery(notificationEventFilterSchema),
    controller.listNotificationEvents
  );

  router.get(
    "/events/:id",
    requirePermission(Permissions.NOTIFICATION_EVENT_VIEW),
    controller.getNotificationEventById
  );

  router.patch(
    "/events/:id",
    requirePermission(Permissions.NOTIFICATION_EVENT_UPDATE),
    validateBody(updateNotificationEventSchema),
    controller.updateNotificationEvent
  );

  router.patch(
    "/events/:id/deactivate",
    requirePermission(Permissions.NOTIFICATION_EVENT_UPDATE),
    controller.deactivateNotificationEvent
  );

  // ==========================================
  // 3. NotificationTemplate Routes
  // ==========================================
  router.post(
    "/templates",
    requirePermission(Permissions.NOTIFICATION_TEMPLATE_CREATE),
    validateBody(createNotificationTemplateSchema),
    controller.createTemplate
  );

  router.get(
    "/templates",
    requirePermission(Permissions.NOTIFICATION_TEMPLATE_VIEW),
    validateQuery(notificationTemplateFilterSchema),
    controller.listTemplates
  );

  router.get(
    "/templates/:id",
    requirePermission(Permissions.NOTIFICATION_TEMPLATE_VIEW),
    controller.getTemplateById
  );

  router.patch(
    "/templates/:id",
    requirePermission(Permissions.NOTIFICATION_TEMPLATE_UPDATE),
    validateBody(updateNotificationTemplateSchema),
    controller.updateTemplate
  );

  router.delete(
    "/templates/:id",
    requirePermission(Permissions.NOTIFICATION_TEMPLATE_DELETE),
    controller.deleteTemplate
  );

  return router;
}