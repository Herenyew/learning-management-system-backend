import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import type { ProgramSurveyService } from "./program-survey.service.js";

export class ProgramSurveyController {
  constructor(private readonly service: ProgramSurveyService) {}

  get = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.get(
        { companyId: req.user.companyId, userId: req.user.appUserId },
        Number(req.params.programEnrollmentId),
        Number(req.params.surveyId),
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  submit = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.submit(
        { companyId: req.user.companyId, userId: req.user.appUserId },
        Number(req.params.programEnrollmentId),
        Number(req.params.surveyId),
        req.body,
      );
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
