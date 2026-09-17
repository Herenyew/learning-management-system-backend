import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import type { ProgramAnalyticsService } from "./program-analytics.service.js";

export class ProgramAnalyticsController {
  constructor(private readonly service: ProgramAnalyticsService) {}

  runtime = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.runtime(req.user.companyId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
