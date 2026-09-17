import { Router } from "express";
import { requirePermission } from "../../common/auth/permission.middleware.js";
import { Permissions } from "../../common/constants/permission.constant.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../common/middlewares/validation.middleware.js";
import prisma from "../../config/database.js";
import { authenticate } from "../auth/auth.middleware.js";
import { ProgramDetailsController } from "./program-details.controller.js";
import {
  createProgramSchema,
  duplicateProgramSchema,
  programIdParamsSchema,
  programListQuerySchema,
  updateProgramSchema,
} from "./program-details.dto.js";
import { ProgramDetailsRepository } from "./program-details.repository.js";
import { ProgramDetailsService } from "./program-details.service.js";
import { ProgramAnalyticsController } from "./program-analytics.controller.js";
import { ProgramAnalyticsService } from "./program-analytics.service.js";

const repository = new ProgramDetailsRepository(prisma);
const service = new ProgramDetailsService(repository);
const controller = new ProgramDetailsController(service);
const analyticsController = new ProgramAnalyticsController(new ProgramAnalyticsService(prisma));

export const programDetailsRouter = Router();

programDetailsRouter.use(authenticate);

programDetailsRouter.post(
  "/",
  requirePermission(Permissions.PROGRAM_CREATE),
  validateBody(createProgramSchema),
  controller.create,
);

programDetailsRouter.get(
  "/",
  requirePermission(Permissions.PROGRAM_READ),
  validateQuery(programListQuerySchema),
  controller.list,
);

programDetailsRouter.get(
  "/analytics/runtime",
  requirePermission(Permissions.PROGRAM_READ),
  analyticsController.runtime,
);

programDetailsRouter.get(
  "/owner-options",
  requirePermission(Permissions.PROGRAM_CREATE),
  controller.listOwners,
);

programDetailsRouter.patch(
  "/:id",
  requirePermission(Permissions.PROGRAM_UPDATE),
  validateParams(programIdParamsSchema),
  validateBody(updateProgramSchema),
  controller.update,
);

programDetailsRouter.post(
  "/:id/archive",
  requirePermission(Permissions.PROGRAM_DELETE),
  validateParams(programIdParamsSchema),
  controller.archive,
);

programDetailsRouter.post(
  "/:id/restore",
  requirePermission(Permissions.PROGRAM_UPDATE),
  validateParams(programIdParamsSchema),
  controller.restore,
);

programDetailsRouter.post(
  "/:id/duplicate",
  requirePermission(Permissions.PROGRAM_CREATE),
  validateParams(programIdParamsSchema),
  validateBody(duplicateProgramSchema),
  controller.duplicate,
);

programDetailsRouter.get(
  "/:id/audit-history",
  requirePermission(Permissions.PROGRAM_READ),
  validateParams(programIdParamsSchema),
  controller.auditHistory,
);

programDetailsRouter.get(
  "/:id",
  requirePermission(Permissions.PROGRAM_READ),
  validateParams(programIdParamsSchema),
  controller.getById,
);
