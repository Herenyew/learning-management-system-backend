import type { Request, Response } from "express";
import { z } from "zod";
import { UnauthorizedError } from "../../common/errors/http-errors.js";
import { enrollmentsService } from "./enrollments.service.js";

const courseEnrollSchema = z.object({
  courseId: z.coerce.number().int().positive(),
});

const programEnrollSchema = z.object({
  programId: z.coerce.number().int().positive(),
});

const contextFrom = (req: Request) => {
  const reqAny = req as any;
  const user = reqAny.user || reqAny.currentUser;
  const companyId = user?.companyId ? Number(user.companyId) : (reqAny.companyId ? Number(reqAny.companyId) : undefined);
  const userId = user?.appUserId ?? (user?.id ? Number(user.id) : undefined);
  if (!companyId || !userId) throw new UnauthorizedError("Authenticated user context is required.");
  return { companyId, userId };
};

export const enrollmentsController = {
  enrollCourse: async (req: Request, res: Response) => {
    const context = contextFrom(req);
    const { courseId } = courseEnrollSchema.parse(req.body);
    const enrollment = await enrollmentsService.enrollCourse(context, courseId);
    return res.status(201).json({ success: true, data: enrollment });
  },

  enrollProgram: async (req: Request, res: Response) => {
    const context = contextFrom(req);
    const { programId } = programEnrollSchema.parse(req.body);
    const enrollment = await enrollmentsService.enrollProgram(context, programId);
    return res.status(201).json({ success: true, data: enrollment });
  },
};
