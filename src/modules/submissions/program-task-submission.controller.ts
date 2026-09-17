import type { NextFunction, Response } from "express";
import { UnauthorizedError } from "../../common/errors/http-errors.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import {
  createProgramTaskUploadSchema,
  peerReviewSchema,
  programEnrollmentIdSchema,
  programTaskIdSchema,
  rejectSubmissionSchema,
  reviewSubmissionSchema,
  submissionIdSchema,
  submitProgramTaskSchema,
} from "./program-task-submission.dto.js";
import type { ProgramTaskSubmissionService } from "./program-task-submission.service.js";

const contextFrom = (req: AuthenticatedRequest) => {
  if (!req.user.companyId || !req.user.appUserId) {
    throw new UnauthorizedError("Authenticated LMS user context is required.");
  }
  return { companyId: req.user.companyId, userId: req.user.appUserId };
};

export class ProgramTaskSubmissionController {
  constructor(private readonly service: ProgramTaskSubmissionService) {}

  listMine = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.listMine(
        contextFrom(req),
        programEnrollmentIdSchema.parse(req.params.programEnrollmentId),
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  createUpload = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.createUpload(
        contextFrom(req),
        programEnrollmentIdSchema.parse(req.params.programEnrollmentId),
        programTaskIdSchema.parse(req.params.taskId),
        createProgramTaskUploadSchema.parse(req.body),
      );
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  submit = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.submit(
        contextFrom(req),
        programEnrollmentIdSchema.parse(req.params.programEnrollmentId),
        programTaskIdSchema.parse(req.params.taskId),
        submitProgramTaskSchema.parse(req.body),
      );
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  peerReviewQueue = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.peerReviewQueue(contextFrom(req));
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  reviewQueue = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.reviewQueue(contextFrom(req));
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  approve = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.approve(
        contextFrom(req),
        submissionIdSchema.parse(req.params.submissionId),
        reviewSubmissionSchema.parse(req.body),
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  reject = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.reject(
        contextFrom(req),
        submissionIdSchema.parse(req.params.submissionId),
        rejectSubmissionSchema.parse(req.body),
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  peerReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.peerReview(
        contextFrom(req),
        submissionIdSchema.parse(req.params.submissionId),
        peerReviewSchema.parse(req.body),
      );
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
