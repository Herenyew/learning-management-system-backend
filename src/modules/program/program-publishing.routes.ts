import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requirePermission } from "../../common/auth/permission.middleware.js";
import { Permissions } from "../../common/constants/permission.constant.js";
import { programPublishingController } from "./program-publishing.controller.js";

const asyncHandler =
  (fn: (req: any, res: any) => Promise<void>) =>
    (req: any, res: any, next: any) =>
      fn(req, res).catch(next);

export const programPublishingRouter = Router();

programPublishingRouter.use(authenticate);

// ── Creator routes ───────────────────────────────────────────────────────────

// Get the program's configured approval workflow and current submission state
programPublishingRouter.get(
  "/publishing/versions/:learningProgramId/approval-requirements",
  requirePermission(Permissions.PROGRAM_READ),
  asyncHandler(programPublishingController.approvalRequirements),
);

// Submit a learning program for review (creator/HR)
programPublishingRouter.post(
  "/publishing/versions/:learningProgramId/submit-for-review",
  requirePermission(Permissions.PROGRAM_PUBLISH),
  asyncHandler(programPublishingController.submitForReview),
);

// Withdraw an active review. Authorization is enforced against the instance in the service.
programPublishingRouter.post(
  "/publishing/instances/:instanceId/withdraw",
  asyncHandler(programPublishingController.withdraw),
);

// ── Reviewer routes ──────────────────────────────────────────────────────────

// List all pending program reviews (admin/hr)
programPublishingRouter.get(
  "/publishing/pending",
  requirePermission(Permissions.PROGRAM_REVIEW),
  asyncHandler(programPublishingController.listPending),
);

// Approve a program
programPublishingRouter.post(
  "/publishing/instances/:instanceId/approve",
  requirePermission(Permissions.PROGRAM_REVIEW),
  asyncHandler(programPublishingController.approve),
);

// Reject a program
programPublishingRouter.post(
  "/publishing/instances/:instanceId/reject",
  requirePermission(Permissions.PROGRAM_REVIEW),
  asyncHandler(programPublishingController.reject),
);

// Request changes
programPublishingRouter.post(
  "/publishing/instances/:instanceId/request-changes",
  requirePermission(Permissions.PROGRAM_REVIEW),
  asyncHandler(programPublishingController.requestChanges),
);
