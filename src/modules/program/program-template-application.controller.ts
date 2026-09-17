import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import type { ProgramTemplateApplicationService } from "./program-template-application.service.js";

export class ProgramTemplateApplicationController {
  constructor(private readonly service: ProgramTemplateApplicationService) { }

  apply = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const program = await this.service.apply(
        { companyId: req.user.companyId, userId: req.user.appUserId },
        Number(req.params.templateId),
        req.body,
      );
      res.status(201).json({ success: true, data: program });
    } catch (error) {
      next(error);
    }
  };

  saveAsTemplate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const template = await this.service.saveAsTemplate(
        { companyId: req.user.companyId, userId: req.user.appUserId },
        Number(req.params.id),
        req.body,
      );
      res.status(201).json({ success: true, data: template });
    } catch (error) {
      next(error);
    }
  };
}
