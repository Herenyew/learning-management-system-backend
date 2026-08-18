import { Router } from "express";
import { z } from "zod";
import { BadgeController } from "./badge-configuration.controller.js";
import { authenticate } from "../../../../common/auth/auth.middleware.js";
import { requirePermission } from "../../../../common/auth/permission.middleware.js";
import { validateBody, validateParams, validateQuery } from "../../../../common/middlewares/validation.middleware.js";
import { Permissions } from "../../../../common/constants/permission.constant.js";
import {
  createBadgeSchema,
  updateBadgeSchema,
  badgeFilterSchema,
  createBadgeRuleSchema,
  updateBadgeRuleSchema,
  badgeRuleFilterSchema,
} from "./badge-configuration.dto.js";

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });
const ruleIdParamSchema = z.object({ ruleId: z.coerce.number().int().positive() });

export function badgeConfigurationRoutes(controller: BadgeController) {
  const router = Router();
  router.use(authenticate);

  router.post(
    "/",
    requirePermission(Permissions.BADGE_CREATE),
    validateBody(createBadgeSchema),
    controller.createBadge.bind(controller)
  );

  router.get(
    "/",
    requirePermission(Permissions.BADGE_VIEW),
    validateQuery(badgeFilterSchema),
    controller.listBadges.bind(controller)
  );

  router.get(
    "/:id",
    requirePermission(Permissions.BADGE_VIEW),
    validateParams(idParamSchema),
    controller.getBadgeById.bind(controller)
  );

  router.put(
    "/:id",
    requirePermission(Permissions.BADGE_UPDATE),
    validateParams(idParamSchema),
    validateBody(updateBadgeSchema),
    controller.updateBadge.bind(controller)
  );

  router.delete(
    "/:id",
    requirePermission(Permissions.BADGE_DELETE),
    validateParams(idParamSchema),
    controller.deleteBadge.bind(controller)
  );

  // Badge rules
  router.post(
    "/:id/rules",
    requirePermission(Permissions.BADGE_RULE_CREATE),
    validateParams(idParamSchema),
    validateBody(createBadgeRuleSchema),
    controller.createBadgeRule.bind(controller)
  );

  router.get(
    "/:id/rules",
    requirePermission(Permissions.BADGE_RULE_VIEW),
    validateParams(idParamSchema),
    validateQuery(badgeRuleFilterSchema),
    controller.listBadgeRules.bind(controller)
  );

  router.put(
    "/:id/rules/:ruleId",
    requirePermission(Permissions.BADGE_RULE_UPDATE),
    validateParams(idParamSchema),
    validateParams(ruleIdParamSchema),
    validateBody(updateBadgeRuleSchema),
    controller.updateBadgeRule.bind(controller)
  );

  router.delete(
    "/:id/rules/:ruleId",
    requirePermission(Permissions.BADGE_RULE_DELETE),
    validateParams(idParamSchema),
    validateParams(ruleIdParamSchema),
    controller.deleteBadgeRule.bind(controller)
  );

  return router;
}
