import { z } from "zod";
import { $Enums } from "@prisma/client";

// Shared ID Parameter Schema
export const idParamSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10)),
});


export const NotificationChannelEnum = z.nativeEnum($Enums.NotificationChannel);

// ==========================================
// 1. NotificationModule Schemas
// ==========================================

export const createNotificationModuleSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug must contain only lowercase letters, numbers, and hyphens",
    }),
  description: z.string().optional(),
  isSystem: z.boolean().optional().default(false),
});

export const updateNotificationModuleSchema =
  createNotificationModuleSchema.partial();

export const notificationModuleFilterSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  search: z.string().optional(),
  isActive: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  isSystem: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  sortBy: z.enum(["name", "slug", "createdAt"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// DTO schemas only — types moved to notification-configuration.types.ts

// ==========================================
// 2. NotificationEvent Schemas
// ==========================================

export const createNotificationEventSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[A-Z0-9_]+$/, {
      message:
        "Code must contain only uppercase letters, numbers, and underscores",
    }),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  moduleId: z.number().int().positive(),
});

export const updateNotificationEventSchema =
  createNotificationEventSchema.partial();

export const notificationEventFilterSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  search: z.string().optional(),
  moduleId: z.coerce.number().int().positive().optional(),
  isActive: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  sortBy: z.enum(["code", "name", "createdAt"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// DTO schemas only — types moved to notification-configuration.types.ts

// ==========================================
// 3. NotificationTemplate Schemas
// ==========================================

export const createNotificationTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  channel: NotificationChannelEnum,
  eventCode: z.string().min(1).max(100),
  notificationEventId: z.number().int().positive().optional(),
  subject: z.string().max(255).optional(),
  body: z.string().min(1),
  variables: z.record(z.string(), z.any()).optional(),
  language: z.string().max(20).optional().default("en"),
});

export const updateNotificationTemplateSchema =
  createNotificationTemplateSchema.partial();

export const notificationTemplateFilterSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  search: z.string().optional(),
  channel: NotificationChannelEnum.optional(),
  eventCode: z.string().optional(),
  notificationEventId: z.coerce.number().int().positive().optional(),
  isActive: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  sortBy: z.enum(["name", "channel", "createdAt"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// DTO schemas only — types moved to notification-configuration.types.ts
