import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { ApprovalWorkflowsRepository } from "./approval-workflows.repository.js";
import { ApprovalWorkflowsService } from "./approval-workflows.service.js";
import { ApprovalWorkflowsController } from "./approval-workflows.controller.js";
import { authenticate } from "../../auth/auth.middleware.js";
import { requirePermission } from "../../../common/auth/permission.middleware.js";
import { Permissions } from "../../../common/constants/permission.constant.js";

import {
  validateBody,
  validateQuery,
} from "../../../common/middlewares/validation.middleware.js";
import {
  createApprovalWorkflowSchema,
  updateApprovalWorkflowSchema,
  approvalWorkflowFilterSchema,
  createApprovalWorkflowStepSchema,
  updateApprovalWorkflowStepSchema,
  employeeOptionsQuerySchema,
} from "./approval-workflows.dto.js";

export function ApprovalWorkflowsRouter(prisma: PrismaClient): Router {
  const router = Router();

  const repository = new ApprovalWorkflowsRepository(prisma);
  const service = new ApprovalWorkflowsService(repository, prisma);
  const controller = new ApprovalWorkflowsController(service);

  router.use(authenticate);

  // ──────────────────────────────────────────────────────────────
  // Options Lookup (dropdowns for the step form)
  // NOTE: registered BEFORE `/:id` so the path is not swallowed.
  // ──────────────────────────────────────────────────────────────

  router.get(
    "/options/roles",
    requirePermission(Permissions.APPROVAL_WORKFLOW_VIEW),
    controller.getRoleOptions
  );

  router.get(
    "/options/employees",
    requirePermission(Permissions.APPROVAL_WORKFLOW_VIEW),
    validateQuery(employeeOptionsQuerySchema),
    controller.searchEmployees
  );

  // ──────────────────────────────────────────────────────────────
  // Approval Workflow Routes
  // ──────────────────────────────────────────────────────────────

  router.post(
    "/",
    requirePermission(Permissions.APPROVAL_WORKFLOW_CREATE),
    validateBody(createApprovalWorkflowSchema),
    controller.createWorkflow
  );

  router.get(
    "/",
    requirePermission(Permissions.APPROVAL_WORKFLOW_VIEW),
    validateQuery(approvalWorkflowFilterSchema),
    controller.getWorkflows
  );

  router.get(
    "/:id",
    requirePermission(Permissions.APPROVAL_WORKFLOW_VIEW),
    controller.getWorkflowById
  );

  router.patch(
    "/:id",
    requirePermission(Permissions.APPROVAL_WORKFLOW_UPDATE),
    validateBody(updateApprovalWorkflowSchema),
    controller.updateWorkflow
  );

  router.delete(
    "/:id",
    requirePermission(Permissions.APPROVAL_WORKFLOW_DELETE),
    controller.deleteWorkflow
  );

  // ──────────────────────────────────────────────────────────────
  // Approval Workflow Step Routes
  // ──────────────────────────────────────────────────────────────

  router.post(
    "/:workflowId/steps",
    requirePermission(Permissions.APPROVAL_WORKFLOW_STEP_CREATE),
    validateBody(createApprovalWorkflowStepSchema),
    controller.createWorkflowStep
  );

  router.get(
    "/:workflowId/steps",
    requirePermission(Permissions.APPROVAL_WORKFLOW_STEP_VIEW),
    controller.getWorkflowSteps
  );

  router.patch(
    "/:workflowId/steps/:stepId",
    requirePermission(Permissions.APPROVAL_WORKFLOW_STEP_UPDATE),
    validateBody(updateApprovalWorkflowStepSchema),
    controller.updateWorkflowStep
  );

  router.delete(
    "/:workflowId/steps/:stepId",
    requirePermission(Permissions.APPROVAL_WORKFLOW_STEP_UPDATE),
    controller.deleteWorkflowStep
  );

  return router;
}