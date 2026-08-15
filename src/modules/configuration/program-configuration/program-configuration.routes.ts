import { Router } from "express";
import { ProgramConfigurationController } from "./program-configuration.controller.js";
import { authenticate } from "../../../common/auth/auth.middleware.js";
import {
  validateBody,
  validateQuery,
  validateParams,
} from "../../../common/middlewares/validation.middleware.js";
import {
  createProgramTypeSchema,
  updateProgramTypeSchema,
  programTypeQuerySchema,
  createProgramCategorySchema,
  updateProgramCategorySchema,
  programCategoryQuerySchema,
  createTaskTypeSchema,
  updateTaskTypeSchema,
  taskTypeQuerySchema,
  createProgramTemplateSchema,
  updateProgramTemplateSchema,
  programTemplateQuerySchema,
  idParamSchema,
} from "./program-configuration.dto.js";

export function programConfigurationRoutes(controller: ProgramConfigurationController): Router {
  const router = Router();

  router.use(authenticate);

  // ─── 1. Program Types ───────────────────────────────────────────────────
  router.post(
    "/program-types",
    validateBody(createProgramTypeSchema),
    controller.createProgramType
  );
  router.get(
    "/program-types",
    validateQuery(programTypeQuerySchema),
    controller.listProgramTypes
  );
  router.get(
    "/program-types/:id",
    validateParams(idParamSchema),
    controller.getProgramTypeById
  );
  router.put(
    "/program-types/:id",
    validateParams(idParamSchema),
    validateBody(updateProgramTypeSchema),
    controller.updateProgramType
  );
  router.delete(
    "/program-types/:id",
    validateParams(idParamSchema),
    controller.deleteProgramType
  );

  // ─── 2. Program Categories ──────────────────────────────────────────────
  router.post(
    "/program-categories",
    validateBody(createProgramCategorySchema),
    controller.createProgramCategory
  );
  router.get(
    "/program-categories",
    validateQuery(programCategoryQuerySchema),
    controller.listProgramCategories
  );
  router.get(
    "/program-categories/:id",
    validateParams(idParamSchema),
    controller.getProgramCategoryById
  );
  router.put(
    "/program-categories/:id",
    validateParams(idParamSchema),
    validateBody(updateProgramCategorySchema),
    controller.updateProgramCategory
  );
  router.delete(
    "/program-categories/:id",
    validateParams(idParamSchema),
    controller.deleteProgramCategory
  );

  // ─── 3. Task Types ──────────────────────────────────────────────────────
  router.post(
    "/task-types",
    validateBody(createTaskTypeSchema),
    controller.createTaskType
  );
  router.get(
    "/task-types",
    validateQuery(taskTypeQuerySchema),
    controller.listTaskTypes
  );
  router.get(
    "/task-types/:id",
    validateParams(idParamSchema),
    controller.getTaskTypeById
  );
  router.put(
    "/task-types/:id",
    validateParams(idParamSchema),
    validateBody(updateTaskTypeSchema),
    controller.updateTaskType
  );
  router.delete(
    "/task-types/:id",
    validateParams(idParamSchema),
    controller.deleteTaskType
  );

  // ─── 4. Program Templates ───────────────────────────────────────────────
  router.post(
    "/templates",
    validateBody(createProgramTemplateSchema),
    controller.createTemplate
  );
  router.get(
    "/templates",
    validateQuery(programTemplateQuerySchema),
    controller.listTemplates
  );
  router.get(
    "/templates/:id",
    validateParams(idParamSchema),
    controller.getTemplateById
  );
  router.put(
    "/templates/:id",
    validateParams(idParamSchema),
    validateBody(updateProgramTemplateSchema),
    controller.updateTemplate
  );
  router.delete(
    "/templates/:id",
    validateParams(idParamSchema),
    controller.deleteTemplate
  );

  return router;
}