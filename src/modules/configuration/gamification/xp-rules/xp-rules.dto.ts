import { z } from "zod";

export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

const xpRuleBaseSchema = z.object({
  name: z.string().min(1).max(150),
  categoryId: z.number().int().positive(),
  triggerEventId: z.number().int().positive(),
  xpAmount: z.number().int().positive(),
  maximumAward: z.number().int().nonnegative().nullable().optional(),
  multiplier: z.number().nonnegative().nullable().optional(),
  targetAudienceId: z.number().int().positive().nullable().optional(),
  courseVersionId: z.number().int().positive().nullable().optional(),
  programId: z.number().int().positive().nullable().optional(),
  conditionExpression: z.record(z.string(), z.unknown()).nullable().optional(),
  isActive: z.boolean().default(true),
});

export const createXpRuleSchema = xpRuleBaseSchema.refine(
  (d) => !(d.courseVersionId && d.programId),
  {
    message: "Cannot set both courseVersionId and programId on one XP rule.",
    path: ["courseVersionId"],
  },
);

// zod v4: .partial() must be applied to the plain object schema — a refined
// schema cannot be partially updated, and the cross-field rule is re-applied
// after partialing (only conflicts when both ids are present together).
export const updateXpRuleSchema = xpRuleBaseSchema.partial().refine(
  (d) => !(d.courseVersionId && d.programId),
  {
    message: "Cannot set both courseVersionId and programId on one XP rule.",
    path: ["courseVersionId"],
  },
);

export const xpRuleFilterSchema = z.object({
  search: z.string().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  triggerEventId: z.coerce.number().int().positive().optional(),
  isActive: z
    .string()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined))
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Do not export inferred types here
