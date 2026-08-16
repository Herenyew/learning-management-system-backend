import { Router } from "express";
import { EnrollmentConfigurationController } from "./enrollment-configuration.controller.js";
import { authenticate } from "../../../common/auth/auth.middleware.js";
import { requirePermission } from "../../../common/auth/permission.middleware.js";
import { Permissions } from "../../../common/constants/permission.constant.js";

import {
  validateBody,
  validateQuery,
  validateParams,
} from "../../../common/middlewares/validation.middleware.js";
import {
  createEnrollmentRuleTypeSchema,
  updateEnrollmentRuleTypeSchema,
  enrollmentRuleTypeFilterSchema,
  createEnrollmentRuleSchema,
  updateEnrollmentRuleSchema,
  enrollmentRuleFilterSchema,
  idParamSchema,
} from "./enrollment-configuration.dto.js";

export function enrollmentConfigurationRoutes(
  controller: EnrollmentConfigurationController
): Router {
  const router = Router();

  router.use(authenticate);

  // ─── 1. Enrollment Rule Types ──────────────────────────────────────────
  router.post(
    "/rule-types",
    requirePermission(Permissions.ENROLLMENT_RULE_TYPE_CREATE),
    validateBody(createEnrollmentRuleTypeSchema),
    controller.createEnrollmentRuleType
  );
  router.get(
    "/rule-types",
    requirePermission(Permissions.ENROLLMENT_RULE_TYPE_VIEW),
    validateQuery(enrollmentRuleTypeFilterSchema),
    controller.getEnrollmentRuleTypes
  );
  router.get(
    "/rule-types/:id",
    requirePermission(Permissions.ENROLLMENT_RULE_TYPE_VIEW),
    validateParams(idParamSchema),
    controller.getEnrollmentRuleTypeById
  );
  router.put(
    "/rule-types/:id",
    requirePermission(Permissions.ENROLLMENT_RULE_TYPE_UPDATE),
    validateParams(idParamSchema),
    validateBody(updateEnrollmentRuleTypeSchema),
    controller.updateEnrollmentRuleType
  );
  router.delete(
    "/rule-types/:id",
    requirePermission(Permissions.ENROLLMENT_RULE_TYPE_DELETE),
    validateParams(idParamSchema),
    controller.deleteEnrollmentRuleType
  );

  // ─── 2. Enrollment Rules ───────────────────────────────────────────────
  router.post(
    "/rules",
    requirePermission(Permissions.ENROLLMENT_RULE_CREATE),
    validateBody(createEnrollmentRuleSchema),
    controller.createEnrollmentRule
  );
  router.get(
    "/rules",
    requirePermission(Permissions.ENROLLMENT_RULE_VIEW),
    validateQuery(enrollmentRuleFilterSchema),
    controller.getEnrollmentRules
  );
  router.get(
    "/rules/:id",
    requirePermission(Permissions.ENROLLMENT_RULE_VIEW),
    validateParams(idParamSchema),
    controller.getEnrollmentRuleById
  );
  router.put(
    "/rules/:id",
    requirePermission(Permissions.ENROLLMENT_RULE_UPDATE),
    validateParams(idParamSchema),
    validateBody(updateEnrollmentRuleSchema),
    controller.updateEnrollmentRule
  );
  router.delete(
    "/rules/:id",
    requirePermission(Permissions.ENROLLMENT_RULE_DELETE),
    validateParams(idParamSchema),
    controller.deleteEnrollmentRule
  );

  return router;
}