import { Router } from "express";
import { validateBody, validateParams } from "../../common/middlewares/validation.middleware.js";
import { authenticate } from "../auth/auth.middleware.js";
import { ProgramSurveyController } from "./program-survey.controller.js";
import { programSurveyParamsSchema, submitProgramSurveySchema } from "./program-survey.dto.js";
import { programSurveyService } from "./program-survey.service.js";

const controller = new ProgramSurveyController(programSurveyService);
export const programSurveyRouter = Router();

programSurveyRouter.use(authenticate);
programSurveyRouter.get(
  "/program/:programEnrollmentId/surveys/:surveyId",
  validateParams(programSurveyParamsSchema),
  controller.get,
);
programSurveyRouter.post(
  "/program/:programEnrollmentId/surveys/:surveyId",
  validateParams(programSurveyParamsSchema),
  validateBody(submitProgramSurveySchema),
  controller.submit,
);
