import { z } from "zod";
import { QuestionAnswerStructure, ShowCorrectAnswersTiming } from "@prisma/client";

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

// ─── 4. Assessment Template DTOs ─────────────────────────────────────────
export const createAssessmentTemplateSchema = z.object({
  name: z
    .string({ message: "Template name is required" })
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(255, "Name cannot exceed 255 characters"),
  description: z.string().trim().optional(),
  assessmentTypeId: z.number().int().positive({ message: "Assessment Type ID is required" }),
  gradingMethodId: z.number().int().positive({ message: "Grading Method ID is required" }),
  passingScore: stringOrNumberToDecimal.pipe(z.number().min(0).max(100)),
  maxAttempts: z.number().int().positive().default(2),
  timeLimitMinutes: z.number().int().positive().optional(),
  randomizeQuestions: z.boolean().default(false),
  randomizeOptions: z.boolean().default(false),
  showResultImmediately: z.boolean().default(false),
  allowReview: z.boolean().default(true),
  showCorrectAnswers: z.nativeEnum(ShowCorrectAnswersTiming, {
    message: "Show correct answers timing is required",
  }),
  lockdownBrowser: z.boolean().default(false),
  proctoringEnabled: z.boolean().default(false),
  negativeMarking: stringOrNumberToDecimal.pipe(z.number().min(0).max(1)).optional(),
  questionCount: z.number().int().nonnegative().optional().default(0),
  isActive: z.boolean().default(true),
});

export const updateAssessmentTemplateSchema = createAssessmentTemplateSchema.partial();

export const assessmentTemplateFilterSchema = z.object({
  search: z.string().trim().optional(),
  assessmentTypeId: z.coerce.number().int().positive().optional(),
  gradingMethodId: z.coerce.number().int().positive().optional(),
  isActive: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
});

// DTO schemas only — types moved to assessment-configuration.types.ts