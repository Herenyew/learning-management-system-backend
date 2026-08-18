import { Router } from "express";
import { z } from "zod";
import { XpRulesController } from "./xp-rules.controller.js";
import { authenticate } from "../../../../common/auth/auth.middleware.js";
import { requirePermission } from "../../../../common/auth/permission.middleware.js";
import { validateBody, validateParams, validateQuery } from "../../../../common/middlewares/validation.middleware.js";
import { Permissions } from "../../../../common/constants/permission.constant.js";
import { createXpRuleSchema, updateXpRuleSchema, xpRuleFilterSchema } from "./xp-rules.dto.js";

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

export function xpRulesRoutes(controller: XpRulesController) {
  const router = Router();
  router.use(authenticate);

  router.post(
    "/",
    requirePermission(Permissions.XP_RULE_CREATE),
    validateBody(createXpRuleSchema),
    controller.createXpRule.bind(controller)
  );

  router.get(
    "/",
    requirePermission(Permissions.XP_RULE_VIEW),
    validateQuery(xpRuleFilterSchema),
    controller.listXpRules.bind(controller)
  );

  router.get(
    "/:id",
    requirePermission(Permissions.XP_RULE_VIEW),
    validateParams(idParamSchema),
    controller.getXpRuleById.bind(controller)
  );

  router.put(
    "/:id",
    requirePermission(Permissions.XP_RULE_UPDATE),
    validateParams(idParamSchema),
    validateBody(updateXpRuleSchema),
    controller.updateXpRule.bind(controller)
  );

  router.delete(
    "/:id",
    requirePermission(Permissions.XP_RULE_DELETE),
    validateParams(idParamSchema),
    controller.deleteXpRule.bind(controller)
  );

  return router;
}
