import { z } from "zod";
import {
  createProgramCourseSchema,
  createProgramMilestoneSchema,
  createProgramTaskSchema,
} from "./program-composition.dto.js";

const positiveId = z.coerce.number().int().positive();

const dateSchema = z
  .string()
  .trim()
  .min(1, "Date is required.")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date.")
  .transform((value) => new Date(value));

export const programTemplateParamsSchema = z.object({ templateId: positiveId }).strict();
export const programTemplateApplicationProgramParamsSchema = z
  .object({ id: positiveId })
  .strict();

export const applyProgramTemplateSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required.").max(255),
    startDate: dateSchema.optional().nullable(),
    endDate: dateSchema.optional().nullable(),
    ownerEmployeeId: z.string().trim().min(1).max(20).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate && data.endDate.getTime() <= data.startDate.getTime()) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date must be after start date.",
      });
    }
  });

export const saveProgramAsTemplateSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required.").max(255),
    description: z.string().trim().optional().nullable(),
  })
  .strict();

const uniqueBy = <T>(items: T[], key: (item: T) => unknown): boolean =>
  new Set(items.map(key)).size === items.length;

export const programTemplateDefaultCoursesSchema = z
  .array(createProgramCourseSchema)
  .superRefine((courses, ctx) => {
    if (!uniqueBy(courses, (course) => course.courseVersionId)) {
      ctx.addIssue({ code: "custom", message: "Template course version IDs must be unique." });
    }
    if (!uniqueBy(courses, (course) => course.displayOrder)) {
      ctx.addIssue({ code: "custom", message: "Template course display orders must be unique." });
    }
  });

export const programTemplateDefaultTasksSchema = z
  .array(createProgramTaskSchema)
  .superRefine((tasks, ctx) => {
    if (!uniqueBy(tasks, (task) => task.displayOrder)) {
      ctx.addIssue({ code: "custom", message: "Template task display orders must be unique." });
    }
  });

export const programTemplateDefaultMilestonesSchema = z
  .array(createProgramMilestoneSchema)
  .superRefine((milestones, ctx) => {
    if (!uniqueBy(milestones, (milestone) => milestone.milestonePercentage)) {
      ctx.addIssue({ code: "custom", message: "Template milestone percentages must be unique." });
    }
  });
