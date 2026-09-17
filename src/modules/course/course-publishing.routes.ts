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

coursePublishingRouter.get(
  "/catalog",
  asyncHandler(coursePublishingController.catalog),
);

// ── Workflow selector ────────────────────────────────────────────────────────

// List all active COURSE workflows — used by the creator to pick one before submit.
// Any authenticated user can call this (no special permission needed to see
// which workflows exist).
coursePublishingRouter.get(
  "/publishing/workflows",
  asyncHandler(coursePublishingController.listWorkflows),
);

// ── Course preview (for approvers to review content inline) ─────────────────

// Any authenticated user with COURSE_REVIEW permission can preview any course
// version in their company — read-only, no modification.
coursePublishingRouter.get(
  "/versions/:courseVersionId/preview",
  requirePermission(Permissions.COURSE_REVIEW),
  asyncHandler(coursePublishingController.getCoursePreview),
);

// ── Creator routes ───────────────────────────────────────────────────────────

// Creator fetches the current approval/publish status of their courses.
// Needed so the creator's local state stays in sync after an approver acts.
coursePublishingRouter.get(
  "/versions/my-courses",
  requirePermission([Permissions.COURSE_CREATE, Permissions.COURSE_PUBLISH], "ANY"),
  asyncHandler(coursePublishingController.getMyCourseStatuses),
);

// Create a new course draft from the builder and submit it for review.
// Creators hold course.create; publishers hold course.publish — either may
// submit for approval (the workflow, not the creator, grants Published).
coursePublishingRouter.post(
  "/versions/submit-new-draft",
  requirePermission([Permissions.COURSE_CREATE, Permissions.COURSE_PUBLISH], "ANY"),
  asyncHandler(coursePublishingController.createAndSubmitDraft),
);

// Submit a course version for review (creator/instructor)
coursePublishingRouter.post(
  "/versions/:courseVersionId/submit-for-review",
  requirePermission([Permissions.COURSE_CREATE, Permissions.COURSE_PUBLISH], "ANY"),
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
