import { Router } from "express";
import { z } from "zod";
import { LearningLevelsController } from "./learning-levels.controller.js";
import { authenticate } from "../../../auth/auth.middleware.js";
import { requirePermission } from "../../../../common/auth/permission.middleware.js";
import { validateBody, validateParams, validateQuery } from "../../../../common/middlewares/validation.middleware.js";
import { Permissions } from "../../../../common/constants/permission.constant.js";
import { createLearningLevelSchema, updateLearningLevelSchema, learningLevelFilterSchema } from "./learning-levels.dto.js";

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

export function learningLevelsRoutes(controller: LearningLevelsController) {
  const router = Router();
  router.use(authenticate);

  router.post(
    "/",
    requirePermission(Permissions.LEARNING_LEVEL_CREATE),
    validateBody(createLearningLevelSchema),
    controller.createLearningLevel.bind(controller)
  );

  router.get(
    "/",
    requirePermission(Permissions.LEARNING_LEVEL_VIEW),
    validateQuery(learningLevelFilterSchema),
    controller.listLearningLevels.bind(controller)
  );

  router.get(
    "/:id",
    requirePermission(Permissions.LEARNING_LEVEL_VIEW),
    validateParams(idParamSchema),
    controller.getLearningLevelById.bind(controller)
  );

  router.put(
    "/:id",
    requirePermission(Permissions.LEARNING_LEVEL_UPDATE),
    validateParams(idParamSchema),
    validateBody(updateLearningLevelSchema),
    controller.updateLearningLevel.bind(controller)
  );

  router.delete(
    "/:id",
    requirePermission(Permissions.LEARNING_LEVEL_DELETE),
    validateParams(idParamSchema),
    controller.deleteLearningLevel.bind(controller)
  );

  return router;
}
