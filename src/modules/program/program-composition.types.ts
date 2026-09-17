import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import type {
  compositionOrderSchema,
  createProgramCohortSchema,
  createProgramCourseSchema,
  createProgramMilestoneSchema,
  createProgramTaskSchema,
  replaceTargetAudiencesSchema,
  updateProgramCohortSchema,
  updateProgramCourseSchema,
  updateProgramMilestoneSchema,
  updateProgramTaskSchema,
} from "./program-composition.dto.js";

export type CompositionContext = {
  companyId: number;
  userId: number;
};

export type CompositionTransaction = Prisma.TransactionClient;

export type ReplaceTargetAudiencesInput = z.infer<typeof replaceTargetAudiencesSchema>;
export type CreateProgramCohortInput = z.infer<typeof createProgramCohortSchema>;
export type UpdateProgramCohortInput = z.infer<typeof updateProgramCohortSchema>;
export type CreateProgramCourseInput = z.infer<typeof createProgramCourseSchema>;
export type UpdateProgramCourseInput = z.infer<typeof updateProgramCourseSchema>;
export type CompositionOrderInput = z.infer<typeof compositionOrderSchema>;
export type CreateProgramTaskInput = z.infer<typeof createProgramTaskSchema>;
export type UpdateProgramTaskInput = z.infer<typeof updateProgramTaskSchema>;
export type CreateProgramMilestoneInput = z.infer<typeof createProgramMilestoneSchema>;
export type UpdateProgramMilestoneInput = z.infer<typeof updateProgramMilestoneSchema>;

export type TaskLinkState = {
  courseVersionId: number | null;
  courseContentId: number | null;
  assessmentId: number | null;
  liveSessionId: number | null;
  surveyId: number | null;
};
