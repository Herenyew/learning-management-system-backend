import { Router } from "express";
import { AudienceController } from "./audience.controller.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../../common/middlewares/validation.middleware.js";
import {
  createAudienceGroupBodySchema,
  updateAudienceGroupBodySchema,
  createAudienceGroupRuleBodySchema,
  updateAudienceGroupRuleBodySchema,
  audienceGroupParamsSchema,
  audienceGroupRuleParamsSchema,
  listAudienceGroupsQuerySchema,
  resolveMembersQuerySchema,
  matchesEmployeeParamsSchema, // now imported from DTO
} from "./audience.dto.js";
import { authenticate, requirePermission } from "../../../common/auth/index.js";
import { Permissions } from "../../../common/constants/permission.constant.js";

export function audienceRoutes(controller: AudienceController): Router {
  const router = Router();

  router.use(authenticate);

  // ─── Audience Groups ──────────────────────────────────────────────

  router.post(
    "/",
    requirePermission(Permissions.AUDIENCE_CREATE),
    validateBody(createAudienceGroupBodySchema),
    controller.create.bind(controller)
  );

  router.get(
    "/",
    requirePermission(Permissions.AUDIENCE_VIEW),
    validateQuery(listAudienceGroupsQuerySchema),
    controller.findMany.bind(controller)
  );

  router.get(
    "/:id",
    requirePermission(Permissions.AUDIENCE_VIEW),
    validateParams(audienceGroupParamsSchema),
    controller.findById.bind(controller)
  );

  router.put(
    "/:id",
    requirePermission(Permissions.AUDIENCE_UPDATE),
    validateParams(audienceGroupParamsSchema),
    validateBody(updateAudienceGroupBodySchema),
    controller.update.bind(controller)
  );

  router.delete(
    "/:id",
    requirePermission(Permissions.AUDIENCE_DELETE),
    validateParams(audienceGroupParamsSchema),
    controller.delete.bind(controller)
  );

  // ─── Member Resolution ────────────────────────────────────────────

  router.get(
    "/:id/members",
    requirePermission(Permissions.AUDIENCE_VIEW),
    validateParams(audienceGroupParamsSchema),
    validateQuery(resolveMembersQuerySchema),
    controller.resolveMembers.bind(controller)
  );

  router.get(
    "/:id/members/:employeeId/check",
    requirePermission(Permissions.AUDIENCE_VIEW),
    validateParams(matchesEmployeeParamsSchema),
    controller.matchesEmployee.bind(controller)
  );

  // ─── Rules ─────────────────────────────────────────────────────────

  router.get(
    "/:id/rules",
    requirePermission(Permissions.AUDIENCE_VIEW),
    validateParams(audienceGroupParamsSchema),
    controller.findRules.bind(controller)
  );

  router.post(
    "/:id/rules",
    requirePermission(Permissions.AUDIENCE_UPDATE),
    validateParams(audienceGroupParamsSchema),
    validateBody(createAudienceGroupRuleBodySchema),
    controller.createRule.bind(controller)
  );

  router.put(
    "/:id/rules/:ruleId",
    requirePermission(Permissions.AUDIENCE_UPDATE),
    validateParams(audienceGroupRuleParamsSchema),
    validateBody(updateAudienceGroupRuleBodySchema),
    controller.updateRule.bind(controller)
  );

  router.delete(
    "/:id/rules/:ruleId",
    requirePermission(Permissions.AUDIENCE_DELETE),
    validateParams(audienceGroupRuleParamsSchema),
    controller.deleteRule.bind(controller)
  );

  return router;
}