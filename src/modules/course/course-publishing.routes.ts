import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requirePermission } from "../../common/auth/permission.middleware.js";
import { Permissions } from "../../common/constants/permission.constant.js";
import { coursePublishingController } from "./course-publishing.controller.js";

const asyncHandler =
  (fn: (req: any, res: any) => Promise<void>) =>
  (req: any, res: any, next: any) =>
    fn(req, res).catch(next);

export const coursePublishingRouter = Router();

coursePublishingRouter.use(authenticate);

// ── Creator routes ───────────────────────────────────────────────────────────

// Submit a course version for review (creator/instructor)
coursePublishingRouter.post(
  "/versions/:courseVersionId/submit-for-review",
  requirePermission(Permissions.COURSE_PUBLISH),
  asyncHandler(coursePublishingController.submitForReview),
);

// ── Reviewer routes ───────────────────────────────────────────────────────────

// List all pending course reviews (admin/hr)
coursePublishingRouter.get(
  "/publishing/pending",
  requirePermission(Permissions.COURSE_REVIEW),
  asyncHandler(coursePublishingController.listPending),
);

// Approve a course
coursePublishingRouter.post(
  "/publishing/instances/:instanceId/approve",
  requirePermission(Permissions.COURSE_REVIEW),
  asyncHandler(coursePublishingController.approve),
);

// Reject a course
coursePublishingRouter.post(
  "/publishing/instances/:instanceId/reject",
  requirePermission(Permissions.COURSE_REVIEW),
  asyncHandler(coursePublishingController.reject),
);

// Request changes
coursePublishingRouter.post(
  "/publishing/instances/:instanceId/request-changes",
  requirePermission(Permissions.COURSE_REVIEW),
  asyncHandler(coursePublishingController.requestChanges),
);
