import { Router } from "express";
import { requirePermission } from "../../common/auth/permission.middleware.js";
import { Permissions } from "../../common/constants/permission.constant.js";
import { authenticate } from "../auth/auth.middleware.js";
import { ProgramTaskSubmissionController } from "./program-task-submission.controller.js";
import { programTaskSubmissionService } from "./program-task-submission.service.js";

const controller = new ProgramTaskSubmissionController(programTaskSubmissionService);

export const programTaskSubmissionsRouter = Router();
export const submissionsRouter = Router();

programTaskSubmissionsRouter.use(authenticate);
submissionsRouter.use(authenticate);

programTaskSubmissionsRouter.get(
  "/program/:programEnrollmentId/tasks",
  requirePermission(Permissions.PROGRAM_READ),
  controller.listMine,
);
programTaskSubmissionsRouter.post(
  "/program/:programEnrollmentId/tasks/:taskId/uploads",
  requirePermission(Permissions.PROGRAM_READ),
  controller.createUpload,
);
programTaskSubmissionsRouter.post(
  "/program/:programEnrollmentId/tasks/:taskId/submissions",
  requirePermission(Permissions.PROGRAM_READ),
  controller.submit,
);

submissionsRouter.get(
  "/peer-review-queue",
  requirePermission(Permissions.PROGRAM_READ),
  controller.peerReviewQueue,
);
submissionsRouter.get(
  "/review-queue",
  requirePermission(Permissions.ASSESSMENT_GRADE),
  controller.reviewQueue,
);
submissionsRouter.post(
  "/:submissionId/approve",
  requirePermission(Permissions.ASSESSMENT_GRADE),
  controller.approve,
);
submissionsRouter.post(
  "/:submissionId/reject",
  requirePermission(Permissions.ASSESSMENT_GRADE),
  controller.reject,
);
submissionsRouter.post(
  "/:submissionId/peer-reviews",
  requirePermission(Permissions.PROGRAM_READ),
  controller.peerReview,
);
