import { Router } from "express";
import { requirePermission } from "../../common/auth/permission.middleware.js";
import { Permissions } from "../../common/constants/permission.constant.js";
import { validateBody, validateParams } from "../../common/middlewares/validation.middleware.js";
import prisma from "../../config/database.js";
import { authenticate } from "../auth/auth.middleware.js";
import { ProgramTemplateApplicationController } from "./program-template-application.controller.js";
import {
  applyProgramTemplateSchema,
  programTemplateApplicationProgramParamsSchema,
  programTemplateParamsSchema,
  saveProgramAsTemplateSchema,
} from "./program-template-application.dto.js";
import { ProgramTemplateApplicationRepository } from "./program-template-application.repository.js";
import { ProgramTemplateApplicationService } from "./program-template-application.service.js";

const repository = new ProgramTemplateApplicationRepository(prisma);
const service = new ProgramTemplateApplicationService(repository);
const controller = new ProgramTemplateApplicationController(service);

/** Mount under `/programs`; all paths below are relative to that mount point. */
export const programTemplateApplicationRouter = Router();

programTemplateApplicationRouter.use(authenticate);

programTemplateApplicationRouter.post(
  "/from-template/:templateId",
  requirePermission([Permissions.PROGRAM_CREATE, Permissions.PROGRAM_TEMPLATE_VIEW]),
  validateParams(programTemplateParamsSchema),
  validateBody(applyProgramTemplateSchema),
  controller.apply,
);

programTemplateApplicationRouter.post(
  "/:id/save-as-template",
  requirePermission([Permissions.PROGRAM_READ, Permissions.PROGRAM_TEMPLATE_CREATE]),
  validateParams(programTemplateApplicationProgramParamsSchema),
  validateBody(saveProgramAsTemplateSchema),
  controller.saveAsTemplate,
);

export default programTemplateApplicationRouter;
