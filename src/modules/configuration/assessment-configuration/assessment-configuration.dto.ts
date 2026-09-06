import { z } from "zod";
import { QuestionAnswerStructure } from "@prisma/client";

// Helper for decimal parsing
const stringOrNumberToDecimal = z
  .union([z.number(), z.string()])
  .transform((val) => Number(val))
  .refine((val) => !isNaN(val), { message: "Must be a valid number" });

// ─── 1. Assessment Type DTOs ───────────────────────────────────────────────
export const createAssessmentTypeSchema = z.object({
  code: z
    .string({ message: "Code is required" })
    .trim()
    .min(2, "Code must be at least 2 characters")
    .max(50, "Code cannot exceed 50 characters")
    .toUpperCase(),
  name: z
    .string({ message: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  description: z.string().trim().optional(),
  isScored: z.boolean().default(true),
  isPractice: z.boolean().default(false),
  isGraded: z.boolean().default(true),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().default(true),
});

export const updateAssessmentTypeSchema = createAssessmentTypeSchema.partial();

export const assessmentTypeFilterSchema = z.object({
  search: z.string().trim().optional(),
  isActive: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
});

// ─── 2. Question Type DTOs ───────────────────────────────────────────────
export const createQuestionTypeSchema = z.object({
  name: z
    .string({ message: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  slug: z
    .string({ message: "Slug is required" })
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(80, "Slug cannot exceed 80 characters")
    .toLowerCase(),
  description: z.string().trim().optional(),
  answerStructure: z.nativeEnum(QuestionAnswerStructure, {
    message: "Valid answer structure is required",
  }),
  isActive: z.boolean().default(true),
});

export const updateQuestionTypeSchema = createQuestionTypeSchema.partial();

export const questionTypeFilterSchema = z.object({
  search: z.string().trim().optional(),
  isActive: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
  answerStructure: z.nativeEnum(QuestionAnswerStructure).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
});

// ─── 3. Grading Method DTOs ───────────────────────────────────────────────
export const createGradingMethodSchema = z.object({
  name: z
    .string({ message: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  slug: z
    .string({ message: "Slug is required" })
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(80, "Slug cannot exceed 80 characters")
    .toLowerCase(),
  description: z.string().trim().optional(),
  isActive: z.boolean().default(true),
});

export const updateGradingMethodSchema = createGradingMethodSchema.partial();

export const gradingMethodFilterSchema = z.object({
  search: z.string().trim().optional(),
  isActive: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
});

// DTO schemas only — types moved to assessment-configuration.types.ts