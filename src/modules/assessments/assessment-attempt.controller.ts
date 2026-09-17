import type { NextFunction, Response } from "express";
import { UnauthorizedError } from "../../common/errors/http-errors.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import {
  answerIdSchema,
  assessmentIdSchema,
  attemptIdSchema,
  gradeAnswerSchema,
  listSubmittedAttemptsQuerySchema,
  questionVersionIdSchema,
  saveAnswerSchema,
  startAttemptSchema,
  submitAttemptSchema,
} from "./assessment-attempt.dto.js";
import type { AssessmentAttemptService } from "./assessment-attempt.service.js";

const contextFrom = (req: AuthenticatedRequest) => {
  if (!req.user.companyId || !req.user.appUserId) {
    throw new UnauthorizedError("Authenticated LMS user context is required.");
  }
  return { companyId: req.user.companyId, userId: req.user.appUserId };
};

export class AssessmentAttemptController {
  constructor(private readonly service: AssessmentAttemptService) {}

  start = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.start(
        contextFrom(req),
        assessmentIdSchema.parse(req.params.assessmentId),
        startAttemptSchema.parse(req.body),
      );
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  get = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.get(
        contextFrom(req),
        attemptIdSchema.parse(req.params.attemptId),
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  saveAnswer = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.saveAnswer(
        contextFrom(req),
        attemptIdSchema.parse(req.params.attemptId),
        questionVersionIdSchema.parse(req.params.questionVersionId),
        saveAnswerSchema.parse(req.body),
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  submit = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      submitAttemptSchema.parse(req.body ?? {});
      const data = await this.service.submit(
        contextFrom(req),
        attemptIdSchema.parse(req.params.attemptId),
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  result = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.result(
        contextFrom(req),
        attemptIdSchema.parse(req.params.attemptId),
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  listSubmitted = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const query = listSubmittedAttemptsQuerySchema.parse(req.query);
      const data = await this.service.listSubmitted(
        contextFrom(req),
        assessmentIdSchema.parse(req.params.assessmentId),
        query.page,
        query.pageSize,
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  gradeAnswer = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.gradeAnswer(
        contextFrom(req),
        attemptIdSchema.parse(req.params.attemptId),
        answerIdSchema.parse(req.params.answerId),
        gradeAnswerSchema.parse(req.body),
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
