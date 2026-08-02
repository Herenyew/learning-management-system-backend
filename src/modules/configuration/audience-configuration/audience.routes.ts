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
import { Permissions } from "../../../common/constants/permission.constant.js";

export function audienceRoutes(controller: AudienceController): Router {
  const router = Router();

  // Protect all routes with authentication middleware
  router.use(authenticate);

  // ==========================================
  // Audience Groups
  // ==========================================

  /**
   * @openapi
   * //configuration/audience:
   *   post:
   *     summary: Create a new audience group
   *     tags: [Audience Configuration]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateAudienceGroupInput'
   *     responses:
   *       201:
   *         description: Audience group successfully created
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AudienceGroup'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiError'
   */
  router.post(
    "/",
    requirePermission(Permissions.AUDIENCE_CREATE),
    validate(createAudienceGroupSchema),
    controller.create,
  );

  /**
   * @openapi
   * //configuration/audience:
   *   get:
   *     summary: Get list of audience groups
   *     tags: [Audience Configuration]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of audience groups retrieved
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/AudienceGroup'
   */
  router.get(
    "/",
    requirePermission(Permissions.AUDIENCE_VIEW),
    controller.findMany,
  );

  /**
   * @openapi
   * //configuration/audience/{id}:
   *   get:
   *     summary: Get an audience group by ID
   *     tags: [Audience Configuration]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Audience Group ID
   *     responses:
   *       200:
   *         description: Audience group details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AudienceGroup'
   *       404:
   *         description: Audience group not found
   */
  router.get(
    "/:id",
    requirePermission(Permissions.AUDIENCE_VIEW),
    controller.findById,
  );

  /**
   * @openapi
   * //configuration/audience/{id}:
   *   put:
   *     summary: Update an audience group
   *     tags: [Audience Configuration]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateAudienceGroupInput'
   *     responses:
   *       200:
   *         description: Audience group updated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AudienceGroup'
   */
  router.put(
    "/:id",
    requirePermission(Permissions.AUDIENCE_UPDATE),
    validate(updateAudienceGroupSchema),
    controller.update,
  );

  /**
   * @openapi
   * //configuration/audience/{id}:
   *   delete:
   *     summary: Delete an audience group
   *     tags: [Audience Configuration]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       204:
   *         description: Audience group deleted successfully
   */
  router.delete(
    "/:id",
    requirePermission(Permissions.AUDIENCE_DELETE),
    controller.delete,
  );

  // ==========================================
  // Audience Member Resolution & Preview
  // ==========================================

  /**
   * @openapi
   * //configuration/audience/{id}/members:
   *   get:
   *     summary: Get all matched employees for an audience group
   *     tags: [Audience Configuration]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: List of matched audience members
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/AudienceMember'
   */
  router.get(
    "/:id/members",
    requirePermission(Permissions.AUDIENCE_VIEW),
    controller.resolveMembers,
  );

  /**
   * @openapi
   * //configuration/audience/{id}/members/{employeeId}/check:
   *   get:
   *     summary: Check if a specific employee matches this audience group
   *     tags: [Audience Configuration]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *       - in: path
   *         name: employeeId
   *         required: true
   *         schema:
   *           type: string
   *         description: EMS Employee ID (e.g. EMP001)
   *     responses:
   *       200:
   *         description: Evaluation check completed
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AudienceMemberCheckResponse'
   */
  router.get(
    "/:id/members/:employeeId/check",
    requirePermission(Permissions.AUDIENCE_VIEW),
    controller.matchesEmployee,
  );

  // ==========================================
  // Audience Group Rules
  // ==========================================

  /**
   * @openapi
   * //configuration/audience/{id}/rules:
   *   get:
   *     summary: Get rules for an audience group
   *     tags: [Audience Configuration]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: List of rules for this group
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/AudienceGroupRule'
   */
  router.get(
    "/:id/rules",
    requirePermission(Permissions.AUDIENCE_VIEW),
    controller.findRules,
  );

  /**
   * @openapi
   * //configuration/audience/{id}/rules:
   *   post:
   *     summary: Add a new rule to an audience group
   *     tags: [Audience Configuration]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateAudienceGroupRuleInput'
   *     responses:
   *       201:
   *         description: Rule created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AudienceGroupRule'
   */
  router.post(
    "/:id/rules",
    requirePermission(Permissions.AUDIENCE_UPDATE),
    validate(createAudienceGroupRuleSchema),
    controller.createRule,
  );

  /**
   * @openapi
   * //configuration/audience/{id}/rules/{ruleId}:
   *   put:
   *     summary: Update an audience rule
   *     tags: [Audience Configuration]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *       - in: path
   *         name: ruleId
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateAudienceGroupRuleInput'
   *     responses:
   *       200:
   *         description: Rule updated successfully
   */
  router.put(
    "/:id/rules/:ruleId",
    requirePermission(Permissions.AUDIENCE_UPDATE),
    validate(updateAudienceGroupRuleSchema),
    controller.updateRule,
  );

  /**
   * @openapi
   * //configuration/audience/{id}/rules/{ruleId}:
   *   delete:
   *     summary: Remove a rule from an audience group
   *     tags: [Audience Configuration]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *       - in: path
   *         name: ruleId
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       204:
   *         description: Rule deleted successfully
   */
  router.delete(
    "/:id/rules/:ruleId",
    requirePermission(Permissions.AUDIENCE_DELETE),
    controller.deleteRule,
  );

  return router;
}