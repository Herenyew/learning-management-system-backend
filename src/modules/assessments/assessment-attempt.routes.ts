import { Router } from "express";
import { requirePermission } from "../../common/auth/permission.middleware.js";
import { Permissions } from "../../common/constants/permission.constant.js";
import { authenticate } from "../auth/auth.middleware.js";
import { AssessmentAttemptController } from "./assessment-attempt.controller.js";
import { assessmentAttemptService } from "./assessment-attempt.service.js";

const controller = new AssessmentAttemptController(assessmentAttemptService);

export const assessmentsRouter = Router();
export const assessmentAttemptsRouter = Router();

assessmentsRouter.use(authenticate);
assessmentAttemptsRouter.use(authenticate);

assessmentsRouter.post(
  "/:assessmentId/attempts",
  requirePermission(Permissions.ASSESSMENT_VIEW),
  controller.start,
);
assessmentsRouter.get(
  "/:assessmentId/submitted-attempts",
  requirePermission(Permissions.ASSESSMENT_GRADE),
  controller.listSubmitted,
);

assessmentAttemptsRouter.get(
  "/:attemptId",
  requirePermission(Permissions.ASSESSMENT_VIEW),
  controller.get,
);
assessmentAttemptsRouter.put(
  "/:attemptId/answers/:questionVersionId",
  requirePermission(Permissions.ASSESSMENT_VIEW),
  controller.saveAnswer,
);
assessmentAttemptsRouter.post(
  "/:attemptId/submit",
  requirePermission(Permissions.ASSESSMENT_VIEW),
  controller.submit,
);
assessmentAttemptsRouter.get(
  "/:attemptId/result",
  requirePermission(Permissions.ASSESSMENT_VIEW),
  controller.result,
);
assessmentAttemptsRouter.put(
  "/:attemptId/answers/:answerId/grade",
  requirePermission(Permissions.ASSESSMENT_GRADE),
  controller.gradeAnswer,
);
