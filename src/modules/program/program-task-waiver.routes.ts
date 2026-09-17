import { Router } from "express";
import { requirePermission } from "../../common/auth/permission.middleware.js";
import { Permissions } from "../../common/constants/permission.constant.js";
import {
  validateBody,
  validateParams,
} from "../../common/middlewares/validation.middleware.js";
import { authenticate } from "../auth/auth.middleware.js";
import { ProgramTaskWaiverController } from "./program-task-waiver.controller.js";
import {
  programTaskWaiverParamsSchema,
  waiveProgramTaskSchema,
} from "./program-task-waiver.dto.js";
import { programTaskWaiverService } from "./program-task-waiver.service.js";

const controller = new ProgramTaskWaiverController(programTaskWaiverService);
const manageProgramEnrollment = requirePermission(
  [Permissions.PROGRAM_UPDATE, Permissions.ENROLLMENT_CONFIG_MANAGE],
  "ANY",
);

/** Mount under `/programs`; all paths below are relative to that mount point. */
export const programTaskWaiverRouter = Router();

programTaskWaiverRouter.use(authenticate);

programTaskWaiverRouter.put(
  "/:programId/enrollments/:enrollmentId/tasks/:taskId/waiver",
  manageProgramEnrollment,
  validateParams(programTaskWaiverParamsSchema),
  validateBody(waiveProgramTaskSchema),
  controller.waive,
);

programTaskWaiverRouter.delete(
  "/:programId/enrollments/:enrollmentId/tasks/:taskId/waiver",
  manageProgramEnrollment,
  validateParams(programTaskWaiverParamsSchema),
  controller.revoke,
);

export default programTaskWaiverRouter;
