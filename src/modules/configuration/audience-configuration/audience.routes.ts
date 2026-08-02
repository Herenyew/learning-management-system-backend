import { Router } from "express";
import { AudienceController } from "./audience.controller.js";
import { validate } from "../../../common/middlewares/validation.middleware.js";
import {
  createAudienceGroupSchema,
  updateAudienceGroupSchema,
  createAudienceGroupRuleSchema,
  updateAudienceGroupRuleSchema,
} from "./audience.dto.js";
import { authenticate, requirePermission } from "../../../common/auth/index.js";

export function audienceRoutes(controller: AudienceController): Router {
  const router = Router();

  // Protect all routes with authentication middleware
  router.use(authenticate);

  // ==========================================
  // Audience Groups
  // ==========================================
  router.post(
    "/",
    requirePermission("audience.create"),
    validate(createAudienceGroupSchema),
    controller.create,
  );

  router.get("/", requirePermission("audience.view"), controller.findMany);
  router.get("/:id", requirePermission("audience.view"), controller.findById);

  router.put(
    "/:id",
    requirePermission("audience.update"),
    validate(updateAudienceGroupSchema),
    controller.update,
  );

  router.delete("/:id", requirePermission("audience.delete"), controller.delete);

  // ==========================================
  // Audience Member Resolution & Preview
  // (:id = audienceGroupId)
  // ==========================================
  router.get("/:id/members", requirePermission("audience.view"), controller.resolveMembers);
  router.get("/:id/members/:employeeId/check", requirePermission("audience.view"), controller.matchesEmployee);

  // ==========================================
  // Audience Group Rules
  // (:id = audienceGroupId)
  // ==========================================
  router.get("/:id/rules", requirePermission("audience.view"), controller.findRules);

  router.post(
    "/:id/rules",
    requirePermission("audience.update"),
    validate(createAudienceGroupRuleSchema),
    controller.createRule,
  );

  router.put(
    "/:id/rules/:ruleId",
    requirePermission("audience.update"),
    validate(updateAudienceGroupRuleSchema),
    controller.updateRule,
  );

  router.delete(
    "/:id/rules/:ruleId",
    requirePermission("audience.delete"),
    controller.deleteRule,
  );

  return router;
}