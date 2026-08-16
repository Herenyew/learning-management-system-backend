import { Router } from "express";
import { ProgramConfigurationController } from "./program-configuration.controller.js";
import { authenticate } from "../../../common/auth/auth.middleware.js";
import { requirePermission } from "../../../common/auth/permission.middleware.js";
import { Permissions } from "../../../common/constants/permission.constant.js";
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

  // Protect all routes with authentication
  router.use(authenticate);

  // ─── 1. Program Types ───────────────────────────────────────────────────
  router.post(
    "/program-types",
    requirePermission(Permissions.PROGRAM_TYPE_CREATE),
    validateBody(createProgramTypeSchema),
    controller.createProgramType.bind(controller)
  );
  router.get(
    "/program-types",
    requirePermission(Permissions.PROGRAM_TYPE_VIEW),
    validateQuery(programTypeQuerySchema),
    controller.listProgramTypes.bind(controller)
  );
  router.get(
    "/program-types/:id",
    requirePermission(Permissions.PROGRAM_TYPE_VIEW),
    validateParams(idParamSchema),
    controller.getProgramTypeById.bind(controller)
  );
  router.put(
    "/program-types/:id",
    requirePermission(Permissions.PROGRAM_TYPE_UPDATE),
    validateParams(idParamSchema),
    validateBody(updateProgramTypeSchema),
    controller.updateProgramType.bind(controller)
  );
  router.delete(
    "/program-types/:id",
    requirePermission(Permissions.PROGRAM_TYPE_DELETE),
    validateParams(idParamSchema),
    controller.deleteProgramType.bind(controller)
  );

  // ─── 2. Program Categories ──────────────────────────────────────────────
  router.post(
    "/program-categories",
    requirePermission(Permissions.PROGRAM_CATEGORY_CREATE),
    validateBody(createProgramCategorySchema),
    controller.createProgramCategory.bind(controller)
  );
  router.get(
    "/program-categories",
    requirePermission(Permissions.PROGRAM_CATEGORY_VIEW),
    validateQuery(programCategoryQuerySchema),
    controller.listProgramCategories.bind(controller)
  );
  router.get(
    "/program-categories/:id",
    requirePermission(Permissions.PROGRAM_CATEGORY_VIEW),
    validateParams(idParamSchema),
    controller.getProgramCategoryById.bind(controller)
  );
  router.put(
    "/program-categories/:id",
    requirePermission(Permissions.PROGRAM_CATEGORY_UPDATE),
    validateParams(idParamSchema),
    validateBody(updateProgramCategorySchema),
    controller.updateProgramCategory.bind(controller)
  );
  router.delete(
    "/program-categories/:id",
    requirePermission(Permissions.PROGRAM_CATEGORY_DELETE),
    validateParams(idParamSchema),
    controller.deleteProgramCategory.bind(controller)
  );

  // ─── 3. Task Types ──────────────────────────────────────────────────────
  router.post(
    "/task-types",
    requirePermission(Permissions.TASK_TYPE_CREATE),
    validateBody(createTaskTypeSchema),
    controller.createTaskType.bind(controller)
  );
  router.get(
    "/task-types",
    requirePermission(Permissions.TASK_TYPE_VIEW),
    validateQuery(taskTypeQuerySchema),
    controller.listTaskTypes.bind(controller)
  );
  router.get(
    "/task-types/:id",
    requirePermission(Permissions.TASK_TYPE_VIEW),
    validateParams(idParamSchema),
    controller.getTaskTypeById.bind(controller)
  );
  router.put(
    "/task-types/:id",
    requirePermission(Permissions.TASK_TYPE_UPDATE),
    validateParams(idParamSchema),
    validateBody(updateTaskTypeSchema),
    controller.updateTaskType.bind(controller)
  );
  router.delete(
    "/task-types/:id",
    requirePermission(Permissions.TASK_TYPE_DELETE),
    validateParams(idParamSchema),
    controller.deleteTaskType.bind(controller)
  );

  // ─── 4. Program Templates ───────────────────────────────────────────────
  router.post(
    "/templates",
    requirePermission(Permissions.PROGRAM_TEMPLATE_CREATE),
    validateBody(createProgramTemplateSchema),
    controller.createTemplate.bind(controller)
  );
  router.get(
    "/templates",
    requirePermission(Permissions.PROGRAM_TEMPLATE_VIEW),
    validateQuery(programTemplateQuerySchema),
    controller.listTemplates.bind(controller)
  );
  router.get(
    "/templates/:id",
    requirePermission(Permissions.PROGRAM_TEMPLATE_VIEW),
    validateParams(idParamSchema),
    controller.getTemplateById.bind(controller)
  );
  router.put(
    "/templates/:id",
    requirePermission(Permissions.PROGRAM_TEMPLATE_UPDATE),
    validateParams(idParamSchema),
    validateBody(updateProgramTemplateSchema),
    controller.updateTemplate.bind(controller)
  );
  router.delete(
    "/templates/:id",
    requirePermission(Permissions.PROGRAM_TEMPLATE_DELETE),
    validateParams(idParamSchema),
    controller.deleteTemplate.bind(controller)
  );

  return router;
}