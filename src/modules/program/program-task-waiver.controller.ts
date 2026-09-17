import type { NextFunction, Response } from "express";
import { UnauthorizedError } from "../../common/errors/http-errors.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import type { ProgramTaskWaiverService } from "./program-task-waiver.service.js";

const contextFrom = (req: AuthenticatedRequest) => {
  if (!req.user.companyId || !req.user.appUserId) {
    throw new UnauthorizedError("Authenticated LMS user context is required.");
  }
  return { companyId: req.user.companyId, userId: req.user.appUserId };
};

export class ProgramTaskWaiverController {
  constructor(private readonly service: ProgramTaskWaiverService) {}

  waive = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.waive(contextFrom(req), {
        programId: Number(req.params.programId),
        enrollmentId: Number(req.params.enrollmentId),
        taskId: Number(req.params.taskId),
      }, req.body);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  revoke = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.revoke(contextFrom(req), {
        programId: Number(req.params.programId),
        enrollmentId: Number(req.params.enrollmentId),
        taskId: Number(req.params.taskId),
      });
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
