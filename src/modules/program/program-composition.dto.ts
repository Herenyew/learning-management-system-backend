import { z } from "zod";

const positiveId = z.coerce.number().int().positive();
const nullablePositiveInt = z.coerce.number().int().positive().nullable();
const nullableNonNegativeInt = z.coerce.number().int().nonnegative().nullable();
const nullablePercentage = z.coerce.number().min(0).max(100).nullable();

const dateSchema = z
  .string()
  .trim()
  .min(1, "Date is required.")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date.")
  .transform((value) => new Date(value));

const nullableDate = dateSchema.nullable();

const uniqueIds = (message: string) =>
  z.array(positiveId).superRefine((ids, ctx) => {
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: "custom", message });
    }
  });

const validateDateRange = (
  data: { startDate?: Date | null; endDate?: Date | null },
  ctx: z.RefinementCtx,
) => {
  if (data.startDate && data.endDate && data.endDate.getTime() <= data.startDate.getTime()) {
    ctx.addIssue({
      code: "custom",
      path: ["endDate"],
      message: "End date must be after start date.",
    });
  }
};

const validateExclusiveSchedule = (
  data: { date?: Date | null; offsetDays?: number | null },
  datePath: string,
  offsetPath: string,
  ctx: z.RefinementCtx,
) => {
  if (data.date != null && data.offsetDays != null) {
    ctx.addIssue({
      code: "custom",
      path: [offsetPath],
      message: `${datePath} and ${offsetPath} cannot both be set.`,
    });
  }
};

export const programCompositionProgramParamsSchema = z
  .object({ programId: positiveId })
  .strict();

export const programCompositionChildParamsSchema = z
  .object({ programId: positiveId, itemId: positiveId })
  .strict();

export const replaceTargetAudiencesSchema = z
  .object({
    audienceGroupIds: uniqueIds("Audience group IDs must be unique."),
  })
  .strict();

export const createProgramCohortSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required.").max(100),
    capacity: nullablePositiveInt.optional(),
    startDate: nullableDate.optional(),
    endDate: nullableDate.optional(),
  })
  .strict()
  .superRefine(validateDateRange);

export const updateProgramCohortSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required.").max(100).optional(),
    capacity: nullablePositiveInt.optional(),
    startDate: nullableDate.optional(),
    endDate: nullableDate.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required.")
  .superRefine(validateDateRange);

export const createProgramCourseSchema = z
  .object({
    courseVersionId: positiveId,
    displayOrder: positiveId.optional(),
    phaseNumber: positiveId.optional().default(1),
    isRequired: z.boolean().optional().default(true),
  })
  .strict();

export const updateProgramCourseSchema = z
  .object({
    courseVersionId: positiveId.optional(),
    displayOrder: positiveId.optional(),
    phaseNumber: positiveId.optional(),
    isRequired: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required.");

export const compositionOrderSchema = z
  .object({
    orderedIds: uniqueIds("Ordered IDs must be unique.").min(1),
  })
  .strict();

const taskFields = {
  title: z.string().trim().min(1, "Title is required.").max(255),
  description: z.string().trim().nullable(),
  taskTypeId: positiveId,
  courseVersionId: positiveId.nullable(),
  courseContentId: positiveId.nullable(),
  assessmentId: positiveId.nullable(),
  liveSessionId: positiveId.nullable(),
  surveyId: positiveId.nullable(),
  maxSubmissions: nullablePositiveInt,
  allowResubmission: z.boolean(),
  isRequired: z.boolean(),
  isBlocking: z.boolean(),
  displayOrder: positiveId,
  phaseNumber: nullablePositiveInt,
  dueDate: nullableDate,
  dueOffsetDays: nullableNonNegativeInt,
  minimumTimeMinutes: nullableNonNegativeInt,
  minimumScore: nullablePercentage,
  minimumAttendance: nullablePercentage,
  requiresManagerApproval: z.boolean(),
  peerReviewRequired: z.boolean(),
  requiredPeerReviewCount: nullablePositiveInt,
  xpAward: nullableNonNegativeInt,
};

export const createProgramTaskSchema = z
  .object({
    title: taskFields.title,
    description: taskFields.description.optional(),
    taskTypeId: taskFields.taskTypeId,
    courseVersionId: taskFields.courseVersionId.optional(),
    courseContentId: taskFields.courseContentId.optional(),
    assessmentId: taskFields.assessmentId.optional(),
    liveSessionId: taskFields.liveSessionId.optional(),
    surveyId: taskFields.surveyId.optional(),
    maxSubmissions: taskFields.maxSubmissions.optional().default(1),
    allowResubmission: taskFields.allowResubmission.optional().default(false),
    isRequired: taskFields.isRequired.optional().default(true),
    isBlocking: taskFields.isBlocking.optional().default(false),
    displayOrder: taskFields.displayOrder.optional(),
    phaseNumber: taskFields.phaseNumber.optional(),
    dueDate: taskFields.dueDate.optional(),
    dueOffsetDays: taskFields.dueOffsetDays.optional(),
    minimumTimeMinutes: taskFields.minimumTimeMinutes.optional(),
    minimumScore: taskFields.minimumScore.optional(),
    minimumAttendance: taskFields.minimumAttendance.optional(),
    requiresManagerApproval: taskFields.requiresManagerApproval.optional().default(false),
    peerReviewRequired: taskFields.peerReviewRequired.optional().default(false),
    requiredPeerReviewCount: taskFields.requiredPeerReviewCount.optional().default(3),
    xpAward: taskFields.xpAward.optional(),
  })
  .strict()
  .superRefine((data, ctx) =>
    validateExclusiveSchedule(
      { date: data.dueDate, offsetDays: data.dueOffsetDays },
      "dueDate",
      "dueOffsetDays",
      ctx,
    ),
  );

export const updateProgramTaskSchema = z
  .object({
    title: taskFields.title.optional(),
    description: taskFields.description.optional(),
    taskTypeId: taskFields.taskTypeId.optional(),
    courseVersionId: taskFields.courseVersionId.optional(),
    courseContentId: taskFields.courseContentId.optional(),
    assessmentId: taskFields.assessmentId.optional(),
    liveSessionId: taskFields.liveSessionId.optional(),
    surveyId: taskFields.surveyId.optional(),
    maxSubmissions: taskFields.maxSubmissions.optional(),
    allowResubmission: taskFields.allowResubmission.optional(),
    isRequired: taskFields.isRequired.optional(),
    isBlocking: taskFields.isBlocking.optional(),
    displayOrder: taskFields.displayOrder.optional(),
    phaseNumber: taskFields.phaseNumber.optional(),
    dueDate: taskFields.dueDate.optional(),
    dueOffsetDays: taskFields.dueOffsetDays.optional(),
    minimumTimeMinutes: taskFields.minimumTimeMinutes.optional(),
    minimumScore: taskFields.minimumScore.optional(),
    minimumAttendance: taskFields.minimumAttendance.optional(),
    requiresManagerApproval: taskFields.requiresManagerApproval.optional(),
    peerReviewRequired: taskFields.peerReviewRequired.optional(),
    requiredPeerReviewCount: taskFields.requiredPeerReviewCount.optional(),
    xpAward: taskFields.xpAward.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required.")
  .superRefine((data, ctx) =>
    validateExclusiveSchedule(
      { date: data.dueDate, offsetDays: data.dueOffsetDays },
      "dueDate",
      "dueOffsetDays",
      ctx,
    ),
  );

const milestoneFields = {
  title: z.string().trim().min(1, "Title is required.").max(255),
  milestonePercentage: z.coerce.number().min(1).max(100),
  targetDate: nullableDate,
  targetOffsetDays: nullableNonNegativeInt,
  completionExpression: z.record(z.string(), z.unknown()).nullable(),
  overdueAction: z.string().trim().nullable(),
  reminderOffsetsDays: z.array(z.coerce.number().int().nonnegative()).default([]),
};

export const createProgramMilestoneSchema = z
  .object({
    title: milestoneFields.title,
    milestonePercentage: milestoneFields.milestonePercentage,
    targetDate: milestoneFields.targetDate.optional(),
    targetOffsetDays: milestoneFields.targetOffsetDays.optional(),
    completionExpression: milestoneFields.completionExpression.optional(),
    overdueAction: milestoneFields.overdueAction.optional(),
    reminderOffsetsDays: milestoneFields.reminderOffsetsDays.optional(),
  })
  .strict()
  .superRefine((data, ctx) =>
    validateExclusiveSchedule(
      { date: data.targetDate, offsetDays: data.targetOffsetDays },
      "targetDate",
      "targetOffsetDays",
      ctx,
    ),
  );

export const updateProgramMilestoneSchema = z
  .object({
    title: milestoneFields.title.optional(),
    milestonePercentage: milestoneFields.milestonePercentage.optional(),
    targetDate: milestoneFields.targetDate.optional(),
    targetOffsetDays: milestoneFields.targetOffsetDays.optional(),
    completionExpression: milestoneFields.completionExpression.optional(),
    overdueAction: milestoneFields.overdueAction.optional(),
    reminderOffsetsDays: milestoneFields.reminderOffsetsDays.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required.")
  .superRefine((data, ctx) =>
    validateExclusiveSchedule(
      { date: data.targetDate, offsetDays: data.targetOffsetDays },
      "targetDate",
      "targetOffsetDays",
      ctx,
    ),
  );
