import { Router } from "express";
import { requirePermission } from "../../common/auth/permission.middleware.js";
import { Permissions } from "../../common/constants/permission.constant.js";
import {
  validateBody,
  validateParams,
} from "../../common/middlewares/validation.middleware.js";
import prisma from "../../config/database.js";
import { authenticate } from "../auth/auth.middleware.js";
import { ProgramCohortRosterController } from "./program-cohort-roster.controller.js";
import { ProgramCohortWaitlistController } from "./program-cohort-waitlist.controller.js";
import {
  bulkProgramCohortEnrollmentSchema,
  createProgramCohortEnrollmentSchema,
  joinProgramCohortWaitlistSchema,
  programCohortEnrollmentParamsSchema,
  programCohortRosterParamsSchema,
  programCohortWaitlistEntryParamsSchema,
} from "./program-cohort-roster.dto.js";
import { ProgramCohortRosterRepository } from "./program-cohort-roster.repository.js";
import { ProgramCohortRosterService } from "./program-cohort-roster.service.js";
import { ProgramCohortWaitlistService } from "./program-cohort-waitlist.service.js";

const repository = new ProgramCohortRosterRepository(prisma);
const service = new ProgramCohortRosterService(repository);
const controller = new ProgramCohortRosterController(service);
const waitlistService = new ProgramCohortWaitlistService(repository);
const waitlistController = new ProgramCohortWaitlistController(waitlistService);
service.setCapacityReleasedHandler((context, programId, cohortId) =>
  waitlistService.process(context, programId, cohortId),
);
const manageRoster = requirePermission(
  [Permissions.PROGRAM_UPDATE, Permissions.ENROLLMENT_CONFIG_MANAGE],
  "ANY",
);

/** Mount under `/programs`; all paths below are relative to that mount point. */
export const programCohortRosterRouter = Router();

programCohortRosterRouter.use(authenticate);

programCohortRosterRouter.get(
  "/:programId/cohorts/:cohortId/roster",
  requirePermission(Permissions.PROGRAM_READ),
  manageRoster,
  validateParams(programCohortRosterParamsSchema),
  controller.getRoster,
);

programCohortRosterRouter.post(
  "/:programId/cohorts/:cohortId/enrollments/me",
  validateParams(programCohortRosterParamsSchema),
  controller.enrollMe,
);

programCohortRosterRouter.post(
  "/:programId/cohorts/:cohortId/enrollments",
  manageRoster,
  validateParams(programCohortRosterParamsSchema),
  validateBody(createProgramCohortEnrollmentSchema),
  controller.enrollEmployee,
);

programCohortRosterRouter.post(
  "/:programId/cohorts/:cohortId/enrollments/bulk",
  manageRoster,
  validateParams(programCohortRosterParamsSchema),
  validateBody(bulkProgramCohortEnrollmentSchema),
  controller.bulkEnrollEmployees,
);

programCohortRosterRouter.delete(
  "/:programId/cohorts/:cohortId/enrollments/:enrollmentId",
  manageRoster,
  validateParams(programCohortEnrollmentParamsSchema),
  controller.removeEnrollment,
);

programCohortRosterRouter.get(
  "/:programId/cohorts/:cohortId/waitlist",
  requirePermission(Permissions.PROGRAM_READ),
  manageRoster,
  validateParams(programCohortRosterParamsSchema),
  waitlistController.getWaitlist,
);

programCohortRosterRouter.post(
  "/:programId/cohorts/:cohortId/waitlist",
  manageRoster,
  validateParams(programCohortRosterParamsSchema),
  validateBody(joinProgramCohortWaitlistSchema),
  waitlistController.join,
);

programCohortRosterRouter.post(
  "/:programId/cohorts/:cohortId/waitlist/process",
  manageRoster,
  validateParams(programCohortRosterParamsSchema),
  waitlistController.process,
);

programCohortRosterRouter.post(
  "/:programId/cohorts/:cohortId/waitlist/:entryId/accept",
  manageRoster,
  validateParams(programCohortWaitlistEntryParamsSchema),
  waitlistController.accept,
);

programCohortRosterRouter.delete(
  "/:programId/cohorts/:cohortId/waitlist/:entryId",
  manageRoster,
  validateParams(programCohortWaitlistEntryParamsSchema),
  waitlistController.cancel,
);

export default programCohortRosterRouter;
