import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import type { ProgramCohortRosterService } from "./program-cohort-roster.service.js";

export class ProgramCohortRosterController {
  constructor(private readonly service: ProgramCohortRosterService) {}

  private context(req: AuthenticatedRequest) {
    return { companyId: req.user.companyId, userId: req.user.appUserId };
  }

  getRoster = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const data = await this.service.getRoster(
        req.user.companyId,
        Number(req.params.programId),
        Number(req.params.cohortId),
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  enrollEmployee = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const data = await this.service.enrollEmployee(
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

  enrollMe = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const data = await this.service.enrollCurrentUser(
        this.context(req),
        Number(req.params.programId),
        Number(req.params.cohortId),
        "SELF_SERVICE",
      );
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  bulkEnrollEmployees = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const data = await this.service.bulkEnrollEmployees(
        this.context(req),
        Number(req.params.programId),
        Number(req.params.cohortId),
        req.body,
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  removeEnrollment = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const data = await this.service.removeEnrollment(
        this.context(req),
        Number(req.params.programId),
        Number(req.params.cohortId),
        Number(req.params.enrollmentId),
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
