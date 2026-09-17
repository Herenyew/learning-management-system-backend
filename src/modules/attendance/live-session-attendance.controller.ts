import type { NextFunction, Response } from "express";
import { UnauthorizedError } from "../../common/errors/http-errors.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import {
  checkInSchema,
  finalizeAttendanceSchema,
  liveSessionIdSchema,
} from "./live-session-attendance.dto.js";
import type { LiveSessionAttendanceService } from "./live-session-attendance.service.js";

const contextFrom = (req: AuthenticatedRequest) => {
  if (!req.user.companyId || !req.user.appUserId) {
    throw new UnauthorizedError("Authenticated LMS user context is required.");
  }
  return {
    companyId: req.user.companyId,
    userId: req.user.appUserId,
    employeeId: req.user.employeeId,
    permissions: req.user.permissions ?? [],
  };
};

export class LiveSessionAttendanceController {
  constructor(private readonly service: LiveSessionAttendanceService) {}

  listMine = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ success: true, data: await this.service.listMine(contextFrom(req)) });
    } catch (error) {
      next(error);
    }
  };

  createChallenge = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.createChallenge(
        contextFrom(req),
        liveSessionIdSchema.parse(req.params.sessionId),
      );
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  checkIn = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const input = checkInSchema.parse(req.body);
      const data = await this.service.checkIn(
        contextFrom(req),
        liveSessionIdSchema.parse(req.params.sessionId),
        input.challenge,
      );
      res.status(data.created ? 201 : 200).json({ success: true, data: data.attendance });
    } catch (error) {
      next(error);
    }
  };

  roster = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.roster(
        contextFrom(req),
        liveSessionIdSchema.parse(req.params.sessionId),
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  finalize = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.finalize(
        contextFrom(req),
        liveSessionIdSchema.parse(req.params.sessionId),
        finalizeAttendanceSchema.parse(req.body),
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
