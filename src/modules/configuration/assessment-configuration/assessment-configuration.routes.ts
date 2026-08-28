import { Router } from "express";
import { z } from "zod";
import { AssessmentConfigurationController } from "./assessment-configuration.controller.js";
import { authenticate } from "../../auth/auth.middleware.js";
import { requirePermission } from "../../../common/auth/permission.middleware.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../../common/middlewares/validation.middleware.js"; // Adjust import path as per your project
import { Permissions } from "../../../common/constants/permission.constant.js";
import {
  createAssessmentTypeSchema,
  updateAssessmentTypeSchema,
  assessmentTypeFilterSchema,
  createQuestionTypeSchema,
  updateQuestionTypeSchema,
  questionTypeFilterSchema,
  createGradingMethodSchema,
  updateGradingMethodSchema,
  gradingMethodFilterSchema,
  createAssessmentTemplateSchema,
  updateAssessmentTemplateSchema,
  assessmentTemplateFilterSchema,
} from "./assessment-configuration.dto.js";

// Common Id Param Schema
const idParamSchema = z.object({
  id: z.coerce.number().int().positive({ message: "ID must be a positive integer" }),
});

export function assessmentConfigurationRoutes(
  controller: AssessmentConfigurationController
): Router {
  const router = Router();

  // 🔒 Authenticate all requests
  router.use(authenticate);

  // ─── 1. Assessment Types ─────────────────────────────────────────────────
  router.post(
    "/assessment-types",
    requirePermission(Permissions.ASSESSMENT_TYPE_CREATE),
    validateBody(createAssessmentTypeSchema),
    controller.createAssessmentType
  );
  router.get(
    "/assessment-types",
    requirePermission(Permissions.ASSESSMENT_TYPE_VIEW),
    validateQuery(assessmentTypeFilterSchema),
    controller.getAssessmentTypes
  );
  router.get(
    "/assessment-types/:id",
    requirePermission(Permissions.ASSESSMENT_TYPE_VIEW),
    validateParams(idParamSchema),
    controller.getAssessmentTypeById
  );
  router.put(
    "/assessment-types/:id",
    requirePermission(Permissions.ASSESSMENT_TYPE_UPDATE),
    validateParams(idParamSchema),
    validateBody(updateAssessmentTypeSchema),
    controller.updateAssessmentType
  );
  router.delete(
    "/assessment-types/:id",
    requirePermission(Permissions.ASSESSMENT_TYPE_DELETE),
    validateParams(idParamSchema),
    controller.deleteAssessmentType
  );

  // ─── 2. Question Types ───────────────────────────────────────────────────
  router.post(
    "/question-types",
    requirePermission(Permissions.QUESTION_TYPE_CREATE),
    validateBody(createQuestionTypeSchema),
    controller.createQuestionType
  );
  router.get(
    "/question-types",
    requirePermission(Permissions.QUESTION_TYPE_VIEW),
    validateQuery(questionTypeFilterSchema),
    controller.getQuestionTypes
  );
  router.get(
    "/question-types/:id",
    requirePermission(Permissions.QUESTION_TYPE_VIEW),
    validateParams(idParamSchema),
    controller.getQuestionTypeById
  );
  router.put(
    "/question-types/:id",
    requirePermission(Permissions.QUESTION_TYPE_UPDATE),
    validateParams(idParamSchema),
    validateBody(updateQuestionTypeSchema),
    controller.updateQuestionType
  );
  router.delete(
    "/question-types/:id",
    requirePermission(Permissions.QUESTION_TYPE_DELETE),
    validateParams(idParamSchema),
    controller.deleteQuestionType
  );

  // ─── 3. Grading Methods ──────────────────────────────────────────────────
  router.post(
    "/grading-methods",
    requirePermission(Permissions.GRADING_METHOD_CREATE),
    validateBody(createGradingMethodSchema),
    controller.createGradingMethod
  );
  router.get(
    "/grading-methods",
    requirePermission(Permissions.GRADING_METHOD_VIEW),
    validateQuery(gradingMethodFilterSchema),
    controller.getGradingMethods
  );
  router.get(
    "/grading-methods/:id",
    requirePermission(Permissions.GRADING_METHOD_VIEW),
    validateParams(idParamSchema),
    controller.getGradingMethodById
  );
  router.put(
    "/grading-methods/:id",
    requirePermission(Permissions.GRADING_METHOD_UPDATE),
    validateParams(idParamSchema),
    validateBody(updateGradingMethodSchema),
    controller.updateGradingMethod
  );
  router.delete(
    "/grading-methods/:id",
    requirePermission(Permissions.GRADING_METHOD_DELETE),
    validateParams(idParamSchema),
    controller.deleteGradingMethod
  );

  // ─── 4. Assessment Templates ─────────────────────────────────────────────
  router.post(
    "/templates",
    requirePermission(Permissions.ASSESSMENT_TEMPLATE_CREATE),
    validateBody(createAssessmentTemplateSchema),
    controller.createTemplate
  );
  router.get(
    "/templates",
    requirePermission(Permissions.ASSESSMENT_TEMPLATE_VIEW),
    validateQuery(assessmentTemplateFilterSchema),
    controller.getTemplates
  );
  router.get(
    "/templates/:id",
    requirePermission(Permissions.ASSESSMENT_TEMPLATE_VIEW),
    validateParams(idParamSchema),
    controller.getTemplateById
  );
  router.put(
    "/templates/:id",
    requirePermission(Permissions.ASSESSMENT_TEMPLATE_UPDATE),
    validateParams(idParamSchema),
    validateBody(updateAssessmentTemplateSchema),
    controller.updateTemplate
  );
  router.delete(
    "/templates/:id",
    requirePermission(Permissions.ASSESSMENT_TEMPLATE_DELETE),
    validateParams(idParamSchema),
    controller.deleteTemplate
  );

  return router;
}