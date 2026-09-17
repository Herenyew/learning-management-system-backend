import { $Enums } from "@prisma/client";
import { z } from "zod";

const dateSchema = z
  .string()
  .trim()
  .min(1, "Date is required.")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date.")
  .transform((value) => new Date(value));

const startOfUtcDay = (date: Date): number =>
  Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

export const calculateDurationDays = (startDate: Date, endDate: Date): number =>
  Math.ceil((endDate.getTime() - startDate.getTime()) / 86_400_000);

export const createProgramSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required.").max(255),
    description: z.string().trim().optional().nullable(),
    programTypeId: z.coerce.number().int().positive(),
    programCategoryId: z.coerce.number().int().positive().optional().nullable(),
    ownerEmployeeId: z.string().trim().min(1, "Owner employee is required.").max(20),
    visibility: z.nativeEnum($Enums.VisibilityType),
    startDate: dateSchema.optional().nullable(),
    endDate: dateSchema.optional().nullable(),
    rollingEnrollment: z.boolean().optional().default(false),
    maxEnrollments: z.coerce.number().int().positive().optional().nullable(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.startDate && startOfUtcDay(data.startDate) < startOfUtcDay(new Date())) {
      ctx.addIssue({
        code: "custom",
        path: ["startDate"],
        message: "Start date cannot be before today.",
      });
    }

    if (data.startDate && data.endDate && data.endDate.getTime() <= data.startDate.getTime()) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date must be after start date.",
      });
    }
  });

export const updateProgramSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required.").max(255).optional(),
    description: z.string().trim().optional().nullable(),
    programTypeId: z.coerce.number().int().positive().optional(),
    programCategoryId: z.coerce.number().int().positive().optional().nullable(),
    ownerEmployeeId: z.string().trim().min(1, "Owner employee is required.").max(20).optional(),
    visibility: z.nativeEnum($Enums.VisibilityType).optional(),
    startDate: dateSchema.optional().nullable(),
    endDate: dateSchema.optional().nullable(),
    rollingEnrollment: z.boolean().optional(),
    maxEnrollments: z.coerce.number().int().positive().optional().nullable(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "At least one program field is required.",
      });
    }

    if (data.startDate && startOfUtcDay(data.startDate) < startOfUtcDay(new Date())) {
      ctx.addIssue({
        code: "custom",
        path: ["startDate"],
        message: "Start date cannot be before today.",
      });
    }

    if (data.startDate && data.endDate && data.endDate.getTime() <= data.startDate.getTime()) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date must be after start date.",
      });
    }
  });

export const duplicateProgramSchema = z.preprocess(
  (value) => value ?? {},
  z
    .object({
      name: z.string().trim().min(1, "Name cannot be empty.").max(255).optional(),
    })
    .strict(),
);

export const programListQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().optional().default(1),
    pageSize: z.coerce.number().int().positive().max(100).optional().default(10),
    search: z.string().trim().min(1).max(255).optional(),
    status: z.nativeEnum($Enums.LearningProgramStatus).optional(),
  })
  .strict();

export const programIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});
