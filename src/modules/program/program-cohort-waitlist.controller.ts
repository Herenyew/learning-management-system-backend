import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import type { ProgramCohortWaitlistService } from "./program-cohort-waitlist.service.js";

export class ProgramCohortWaitlistController {
  constructor(private readonly service: ProgramCohortWaitlistService) {}

  private context(req: AuthenticatedRequest) {
    return { companyId: req.user.companyId, userId: req.user.appUserId };
  }

  getWaitlist = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const data = await this.service.getWaitlist(
        req.user.companyId,
        Number(req.params.programId),
        Number(req.params.cohortId),
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  join = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.join(
        this.context(req),
        Number(req.params.programId),
        Number(req.params.cohortId),
        req.body,
      );
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.cancel(
        this.context(req),
        Number(req.params.programId),
        Number(req.params.cohortId),
        Number(req.params.entryId),
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  process = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.process(
        this.context(req),
        Number(req.params.programId),
        Number(req.params.cohortId),
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  accept = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.accept(
        this.context(req),
        Number(req.params.programId),
        Number(req.params.cohortId),
        Number(req.params.entryId),
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
