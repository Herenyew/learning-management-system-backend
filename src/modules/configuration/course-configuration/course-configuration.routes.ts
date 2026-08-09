import { Router } from "express";
import { CourseConfigurationController } from "./course-configuration.controller.js";

// Common Middlewares
import { authenticate } from "../../../common/auth/auth.middleware.js";
import { requirePermission } from "../../../common/auth/permission.middleware.js";
import {
  validateBody,
  validateQuery,
  validateParams,
} from "../../../common/middlewares/validation.middleware.js";
import { Permissions } from "../../../common/constants/permission.constant.js";

// Common Param Schemas
import { z } from "zod";

const idParamSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10)),
});

// Import DTO Schemas
import {
  createCourseCategorySchema,
  updateCourseCategorySchema,
  courseCategoryFilterQuerySchema,
  createDifficultyLevelSchema,
  updateDifficultyLevelSchema,
  difficultyLevelFilterQuerySchema,
  createContentTypeSchema,
  updateContentTypeSchema,
  contentTypeFilterQuerySchema,
  createContentFileTypeSchema,
  updateContentFileTypeSchema,
  contentFileTypeFilterQuerySchema,
  createCourseTemplateSchema,
  updateCourseTemplateSchema,
  courseTemplateFilterQuerySchema,
} from "./course-configuration.dto.js";

export function courseConfigurationRoutes(
  controller: CourseConfigurationController
): Router {
  const router = Router();

  // Apply authentication globally across all configuration routes
  router.use(authenticate);

  // ─── 1. Course Categories ──────────────────────────────────────────────

  router.post(
    "/categories",
    requirePermission(Permissions.COURSE_CATEGORY_CREATE),
    validateBody(createCourseCategorySchema),
    controller.createCategory.bind(controller)
  );

  router.get(
    "/categories",
    requirePermission(Permissions.COURSE_CATEGORY_VIEW),
    validateQuery(courseCategoryFilterQuerySchema),
    controller.getCategories.bind(controller)
  );

  router.get(
    "/categories/:id",
    requirePermission(Permissions.COURSE_CATEGORY_VIEW),
    validateParams(idParamSchema),
    controller.getCategoryById.bind(controller)
  );

  router.put(
    "/categories/:id",
    requirePermission(Permissions.COURSE_CATEGORY_UPDATE),
    validateParams(idParamSchema),
    validateBody(updateCourseCategorySchema),
    controller.updateCategory.bind(controller)
  );

  router.delete(
    "/categories/:id",
    requirePermission(Permissions.COURSE_CATEGORY_DELETE),
    validateParams(idParamSchema),
    controller.deleteCategory.bind(controller)
  );

  // ─── 2. Difficulty Levels ────────────────────────────────────────────

  router.post(
    "/difficulty-levels",
    requirePermission(Permissions.DIFFICULTY_LEVEL_CREATE),
    validateBody(createDifficultyLevelSchema),
    controller.createDifficultyLevel.bind(controller)
  );

  router.get(
    "/difficulty-levels",
    requirePermission(Permissions.DIFFICULTY_LEVEL_VIEW),
    validateQuery(difficultyLevelFilterQuerySchema),
    controller.getDifficultyLevels.bind(controller)
  );

  router.get(
    "/difficulty-levels/:id",
    requirePermission(Permissions.DIFFICULTY_LEVEL_VIEW),
    validateParams(idParamSchema),
    controller.getDifficultyLevelById.bind(controller)
  );

  router.put(
    "/difficulty-levels/:id",
    requirePermission(Permissions.DIFFICULTY_LEVEL_UPDATE),
    validateParams(idParamSchema),
    validateBody(updateDifficultyLevelSchema),
    controller.updateDifficultyLevel.bind(controller)
  );

  router.delete(
    "/difficulty-levels/:id",
    requirePermission(Permissions.DIFFICULTY_LEVEL_DELETE),
    validateParams(idParamSchema),
    controller.deleteDifficultyLevel.bind(controller)
  );

  // ─── 3. Content Types (System Table - Requires Super Admin / System Permission) ──

  router.post(
    "/content-types",
    requirePermission(Permissions.SYSTEM_CONFIG_MANAGE),
    validateBody(createContentTypeSchema),
    controller.createContentType.bind(controller)
  );

  router.get(
    "/content-types",
    requirePermission(Permissions.COURSE_VIEW),
    validateQuery(contentTypeFilterQuerySchema),
    controller.getContentTypes.bind(controller)
  );

  router.get(
    "/content-types/:id",
    requirePermission(Permissions.COURSE_VIEW),
    validateParams(idParamSchema),
    controller.getContentTypeById.bind(controller)
  );

  router.put(
    "/content-types/:id",
    requirePermission(Permissions.SYSTEM_CONFIG_MANAGE),
    validateParams(idParamSchema),
    validateBody(updateContentTypeSchema),
    controller.updateContentType.bind(controller)
  );

  router.delete(
    "/content-types/:id",
    requirePermission(Permissions.SYSTEM_CONFIG_MANAGE),
    validateParams(idParamSchema),
    controller.deleteContentType.bind(controller)
  );

  // ─── 4. Content File Types (System Table) ────────────────────────────

  router.post(
    "/content-file-types",
    requirePermission(Permissions.SYSTEM_CONFIG_MANAGE),
    validateBody(createContentFileTypeSchema),
    controller.createContentFileType.bind(controller)
  );

  router.get(
    "/content-file-types",
    requirePermission(Permissions.COURSE_VIEW),
    validateQuery(contentFileTypeFilterQuerySchema),
    controller.getContentFileTypes.bind(controller)
  );

  router.get(
    "/content-file-types/:id",
    requirePermission(Permissions.COURSE_VIEW),
    validateParams(idParamSchema),
    controller.getContentFileTypeById.bind(controller)
  );

  router.put(
    "/content-file-types/:id",
    requirePermission(Permissions.SYSTEM_CONFIG_MANAGE),
    validateParams(idParamSchema),
    validateBody(updateContentFileTypeSchema),
    controller.updateContentFileType.bind(controller)
  );

  router.delete(
    "/content-file-types/:id",
    requirePermission(Permissions.SYSTEM_CONFIG_MANAGE),
    validateParams(idParamSchema),
    controller.deleteContentFileType.bind(controller)
  );

  // ─── 5. Course Templates ─────────────────────────────────────────────

  router.post(
    "/templates",
    requirePermission(Permissions.COURSE_TEMPLATE_CREATE),
    validateBody(createCourseTemplateSchema),
    controller.createTemplate.bind(controller)
  );

  router.get(
    "/templates",
    requirePermission(Permissions.COURSE_TEMPLATE_VIEW),
    validateQuery(courseTemplateFilterQuerySchema),
    controller.getTemplates.bind(controller)
  );

  router.get(
    "/templates/:id",
    requirePermission(Permissions.COURSE_TEMPLATE_VIEW),
    validateParams(idParamSchema),
    controller.getTemplateById.bind(controller)
  );

  router.put(
    "/templates/:id",
    requirePermission(Permissions.COURSE_TEMPLATE_UPDATE),
    validateParams(idParamSchema),
    validateBody(updateCourseTemplateSchema),
    controller.updateTemplate.bind(controller)
  );

  router.delete(
    "/templates/:id",
    requirePermission(Permissions.COURSE_TEMPLATE_DELETE),
    validateParams(idParamSchema),
    controller.deleteTemplate.bind(controller)
  );

  return router;
}