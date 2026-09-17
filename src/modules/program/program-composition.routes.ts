import { Router } from "express";
import { requirePermission } from "../../common/auth/permission.middleware.js";
import { Permissions } from "../../common/constants/permission.constant.js";
import { validateBody, validateParams } from "../../common/middlewares/validation.middleware.js";
import prisma from "../../config/database.js";
import { authenticate } from "../auth/auth.middleware.js";
import { ProgramCompositionController } from "./program-composition.controller.js";
import {
  compositionOrderSchema,
  createProgramCohortSchema,
  createProgramCourseSchema,
  createProgramMilestoneSchema,
  createProgramTaskSchema,
  programCompositionChildParamsSchema,
  programCompositionProgramParamsSchema,
  replaceTargetAudiencesSchema,
  updateProgramCohortSchema,
  updateProgramCourseSchema,
  updateProgramMilestoneSchema,
  updateProgramTaskSchema,
} from "./program-composition.dto.js";
import { ProgramCompositionRepository } from "./program-composition.repository.js";
import { ProgramCompositionService } from "./program-composition.service.js";

const repository = new ProgramCompositionRepository(prisma);
const service = new ProgramCompositionService(repository);
const controller = new ProgramCompositionController(service);

/** Mount under `/programs`; all paths below are relative to that mount point. */
export const programCompositionRouter = Router();

programCompositionRouter.use(authenticate);

programCompositionRouter.get(
  "/:programId/target-audiences",
  requirePermission(Permissions.PROGRAM_READ),
  validateParams(programCompositionProgramParamsSchema),
  controller.getTargetAudiences,
);
programCompositionRouter.put(
  "/:programId/target-audiences",
  requirePermission(Permissions.PROGRAM_UPDATE),
  validateParams(programCompositionProgramParamsSchema),
  validateBody(replaceTargetAudiencesSchema),
  controller.replaceTargetAudiences,
);

programCompositionRouter.get(
  "/:programId/cohorts",
  requirePermission(Permissions.PROGRAM_READ),
  validateParams(programCompositionProgramParamsSchema),
  controller.getCohorts,
);
programCompositionRouter.post(
  "/:programId/cohorts",
  requirePermission(Permissions.PROGRAM_UPDATE),
  validateParams(programCompositionProgramParamsSchema),
  validateBody(createProgramCohortSchema),
  controller.createCohort,
);
programCompositionRouter.patch(
  "/:programId/cohorts/:itemId",
  requirePermission(Permissions.PROGRAM_UPDATE),
  validateParams(programCompositionChildParamsSchema),
  validateBody(updateProgramCohortSchema),
  controller.updateCohort,
);
programCompositionRouter.delete(
  "/:programId/cohorts/:itemId",
  requirePermission(Permissions.PROGRAM_UPDATE),
  validateParams(programCompositionChildParamsSchema),
  controller.deleteCohort,
);

programCompositionRouter.get(
  "/:programId/courses",
  requirePermission(Permissions.PROGRAM_READ),
  validateParams(programCompositionProgramParamsSchema),
  controller.getCourses,
);
programCompositionRouter.post(
  "/:programId/courses",
  requirePermission(Permissions.PROGRAM_UPDATE),
  validateParams(programCompositionProgramParamsSchema),
  validateBody(createProgramCourseSchema),
  controller.createCourse,
);
programCompositionRouter.put(
  "/:programId/courses/order",
  requirePermission(Permissions.PROGRAM_UPDATE),
  validateParams(programCompositionProgramParamsSchema),
  validateBody(compositionOrderSchema),
  controller.orderCourses,
);
programCompositionRouter.patch(
  "/:programId/courses/:itemId",
  requirePermission(Permissions.PROGRAM_UPDATE),
  validateParams(programCompositionChildParamsSchema),
  validateBody(updateProgramCourseSchema),
  controller.updateCourse,
);
programCompositionRouter.delete(
  "/:programId/courses/:itemId",
  requirePermission(Permissions.PROGRAM_UPDATE),
  validateParams(programCompositionChildParamsSchema),
  controller.deleteCourse,
);

programCompositionRouter.get(
  "/:programId/tasks",
  requirePermission(Permissions.PROGRAM_READ),
  validateParams(programCompositionProgramParamsSchema),
  controller.getTasks,
);
programCompositionRouter.post(
  "/:programId/tasks",
  requirePermission(Permissions.PROGRAM_UPDATE),
  validateParams(programCompositionProgramParamsSchema),
  validateBody(createProgramTaskSchema),
  controller.createTask,
);
programCompositionRouter.put(
  "/:programId/tasks/order",
  requirePermission(Permissions.PROGRAM_UPDATE),
  validateParams(programCompositionProgramParamsSchema),
  validateBody(compositionOrderSchema),
  controller.orderTasks,
);
programCompositionRouter.patch(
  "/:programId/tasks/:itemId",
  requirePermission(Permissions.PROGRAM_UPDATE),
  validateParams(programCompositionChildParamsSchema),
  validateBody(updateProgramTaskSchema),
  controller.updateTask,
);
programCompositionRouter.delete(
  "/:programId/tasks/:itemId",
  requirePermission(Permissions.PROGRAM_UPDATE),
  validateParams(programCompositionChildParamsSchema),
  controller.deleteTask,
);

programCompositionRouter.get(
  "/:programId/milestones",
  requirePermission(Permissions.PROGRAM_READ),
  validateParams(programCompositionProgramParamsSchema),
  controller.getMilestones,
);
programCompositionRouter.post(
  "/:programId/milestones",
  requirePermission(Permissions.PROGRAM_UPDATE),
  validateParams(programCompositionProgramParamsSchema),
  validateBody(createProgramMilestoneSchema),
  controller.createMilestone,
);
programCompositionRouter.patch(
  "/:programId/milestones/:itemId",
  requirePermission(Permissions.PROGRAM_UPDATE),
  validateParams(programCompositionChildParamsSchema),
  validateBody(updateProgramMilestoneSchema),
  controller.updateMilestone,
);
programCompositionRouter.delete(
  "/:programId/milestones/:itemId",
  requirePermission(Permissions.PROGRAM_UPDATE),
  validateParams(programCompositionChildParamsSchema),
  controller.deleteMilestone,
);

export default programCompositionRouter;
