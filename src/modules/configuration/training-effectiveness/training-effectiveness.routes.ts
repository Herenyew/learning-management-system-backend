import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { TrainingEffectivenessRepository } from "./training-effectiveness.repository.js";
import { TrainingEffectivenessService } from "./training-effectiveness.service.js";
import { TrainingEffectivenessController } from "./training-effectiveness.controller.js";
import { authenticate } from "../../../common/auth/auth.middleware.js";
import { requirePermission } from "../../../common/auth/permission.middleware.js";
import { Permissions } from "../../../common/constants/permission.constant.js";
import {
  validateBody,
  validateQuery,
  validateParams,
} from "../../../common/middlewares/validation.middleware.js";
import {
  createEffectivenessWeightConfigSchema,
  updateEffectivenessWeightConfigSchema,
  effectivenessWeightConfigFilterSchema,
  idParamSchema,
} from "./training-effectiveness.dto.js";

export function TrainingEffectivenessRouter(prisma: PrismaClient): Router {
  const router = Router();

  const repository = new TrainingEffectivenessRepository(prisma);
  const service = new TrainingEffectivenessService(repository, prisma);
  const controller = new TrainingEffectivenessController(service);

  // Protect all routes with authentication
  router.use(authenticate);

  // ──────────────────────────────────────────────────────────────
  // Effectiveness Weight Config Routes
  // ──────────────────────────────────────────────────────────────

  router.post(
    "/",
    requirePermission(Permissions.EFFECTIVENESS_WEIGHT_CREATE),
    validateBody(createEffectivenessWeightConfigSchema),
    controller.createWeightConfig.bind(controller)
  );

  router.get(
    "/",
    requirePermission(Permissions.EFFECTIVENESS_WEIGHT_VIEW),
    validateQuery(effectivenessWeightConfigFilterSchema),
    controller.getWeightConfigs.bind(controller)
  );

  router.get(
    "/active",
    requirePermission(Permissions.EFFECTIVENESS_WEIGHT_VIEW),
    controller.getActiveWeightConfig.bind(controller)
  );

  router.get(
    "/:id",
    requirePermission(Permissions.EFFECTIVENESS_WEIGHT_VIEW),
    validateParams(idParamSchema),
    controller.getWeightConfigById.bind(controller)
  );

  router.patch(
    "/:id",
    requirePermission(Permissions.EFFECTIVENESS_WEIGHT_UPDATE),
    validateParams(idParamSchema),
    validateBody(updateEffectivenessWeightConfigSchema),
    controller.updateWeightConfig.bind(controller)
  );

  router.patch(
    "/:id/deactivate",
    requirePermission(Permissions.EFFECTIVENESS_WEIGHT_UPDATE),
    validateParams(idParamSchema),
    controller.deactivateWeightConfig.bind(controller)
  );

  return router;
}