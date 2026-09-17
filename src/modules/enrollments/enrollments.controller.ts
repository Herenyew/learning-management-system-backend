import type { Request, Response } from "express";
import { z } from "zod";
import { UnauthorizedError } from "../../common/errors/http-errors.js";
import {
  endLearningSessionSchema,
  enrollmentIdSchema,
  contentIdSchema,
  sessionIdSchema,
  startLearningSessionSchema,
  updateContentProgressSchema,
} from "./enrollment-progress.dto.js";
import { enrollmentProgressService } from "./enrollment-progress.service.js";
import { enrollmentsService } from "./enrollments.service.js";

const courseEnrollSchema = z.object({
  courseId: z.coerce.number().int().positive(),
});

export const programEnrollSchema = z.object({
  programId: z.coerce.number().int().positive(),
  cohortId: z.coerce.number().int().positive(),
}).strict();

const reevaluateCourseSchema = z.object({}).strict();

const contextFrom = (req: Request) => {
  const reqAny = req as any;
  const user = reqAny.user || reqAny.currentUser;
  const companyId = user?.companyId ? Number(user.companyId) : (reqAny.companyId ? Number(reqAny.companyId) : undefined);
  const userId = user?.appUserId ?? (user?.id ? Number(user.id) : undefined);
  if (!companyId || !userId) throw new UnauthorizedError("Authenticated user context is required.");
  return { companyId, userId };
};

export const enrollmentsController = {
  listMine: async (req: Request, res: Response) => {
    const data = await enrollmentProgressService.listMine(contextFrom(req));
    return res.status(200).json({ success: true, data });
  },

  listMyPrograms: async (req: Request, res: Response) => {
    const data = await enrollmentProgressService.listMyPrograms(contextFrom(req));
    return res.status(200).json({ success: true, data });
  },

  getProgress: async (req: Request, res: Response) => {
    const context = contextFrom(req);
    const enrollmentId = enrollmentIdSchema.parse(req.params.enrollmentId);
    const data = await enrollmentProgressService.getProgress(context, enrollmentId);
    return res.status(200).json({ success: true, data });
  },

  updateContentProgress: async (req: Request, res: Response) => {
    const context = contextFrom(req);
    const enrollmentId = enrollmentIdSchema.parse(req.params.enrollmentId);
    const contentId = contentIdSchema.parse(req.params.contentId);
    const input = updateContentProgressSchema.parse(req.body);
    const data = await enrollmentProgressService.updateContent(
      context,
      enrollmentId,
      contentId,
      input,
    );
    return res.status(200).json({ success: true, data });
  },

  reevaluateProgram: async (req: Request, res: Response) => {
    const context = contextFrom(req);
    const enrollmentId = enrollmentIdSchema.parse(req.params.enrollmentId);
    reevaluateCourseSchema.parse(req.body ?? {});
    const data = await enrollmentProgressService.reevaluateProgram(context, enrollmentId);
    return res.status(200).json({ success: true, data });
  },

  startSession: async (req: Request, res: Response) => {
    const context = contextFrom(req);
    const enrollmentId = enrollmentIdSchema.parse(req.params.enrollmentId);
    const input = startLearningSessionSchema.parse(req.body);
    const data = await enrollmentProgressService.startSession(context, enrollmentId, input, {
      ipAddress: req.ip,
    });
    return res.status(201).json({ success: true, data });
  },

  endSession: async (req: Request, res: Response) => {
    const context = contextFrom(req);
    const sessionId = sessionIdSchema.parse(req.params.sessionId);
    const input = endLearningSessionSchema.parse(req.body);
    const data = await enrollmentProgressService.endSession(context, sessionId, input);
    return res.status(200).json({ success: true, data });
  },

  enrollCourse: async (req: Request, res: Response) => {
    const context = contextFrom(req);
    const { courseId } = courseEnrollSchema.parse(req.body);
    const enrollment = await enrollmentsService.enrollCourse(context, courseId);
    return res.status(201).json({ success: true, data: enrollment });
  },

  enrollProgram: async (req: Request, res: Response) => {
    const context = contextFrom(req);
    const { programId, cohortId } = programEnrollSchema.parse(req.body);
    const enrollment = await enrollmentsService.enrollProgram(context, programId, cohortId);
    return res.status(201).json({ success: true, data: enrollment });
  },

  completeCourse: async (req: Request, res: Response) => {
    const context = contextFrom(req);
    const enrollmentId = enrollmentIdSchema.parse(req.params.enrollmentId);
    reevaluateCourseSchema.parse(req.body ?? {});
    const result = await enrollmentProgressService.reevaluate(context, enrollmentId);
    return res.status(200).json({ success: true, data: result });
  },
};
