import { z } from "zod";

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive({ message: "ID must be a positive integer" }),
});

export const CustomFieldTargetEnum = z.enum([
  "COURSE",
  "PROGRAM",
  "TNA_REQUEST",
  "ENROLLMENT",
  "CERTIFICATE",
  "USER_PROFILE",
  "CONTENT",
]);

export const createCustomFieldSchema = z.object({
  name: z.string().min(1).max(200),
  fieldKey: z.string().min(1).max(100),
  target: CustomFieldTargetEnum,
  description: z.string().max(1000).optional(),
  fieldType: z.enum(["TEXT", "NUMBER", "SINGLE_SELECT", "MULTI_SELECT", "BOOLEAN"]).default("TEXT"),
  settingsJson: z.record(z.string(), z.any()).optional(),
  isRequired: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const updateCustomFieldSchema = createCustomFieldSchema.partial();

export const customFieldFilterSchema = z.object({
  search: z.string().optional(),
  target: CustomFieldTargetEnum.optional(),
  isActive: z
    .string()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined))
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// DO NOT export inferred types here; those belong in .types.ts
