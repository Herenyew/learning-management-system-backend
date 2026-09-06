import { z } from "zod";
import { ContentLifecycleStatus } from "@prisma/client";

// ==========================================
// Common Pagination & Sorting Schema
// ==========================================
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  sortBy: z.string().optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  search: z.string().trim().optional(),
});

// ==========================================
// 1. CertificateType DTOs
// ==========================================
export const CreateCertificateTypeSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z.string().trim().min(1).max(80),
  description: z.string().trim().optional(),
  isSystem: z.boolean().optional().default(false),
});

export const UpdateCertificateTypeSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  slug: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().optional().nullable(),
  isSystem: z.boolean().optional(),
});

export const CertificateTypeFilterSchema = PaginationQuerySchema.extend({
  isActive: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  isSystem: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
});

// DTO schemas only — types moved to certificate-configuration.types.ts

// ==========================================
// 2. CredentialSource DTOs
// ==========================================
export const CreateCredentialSourceSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z.string().trim().min(1).max(80),
  description: z.string().trim().optional(),
  isSystem: z.boolean().optional().default(false),
});

export const UpdateCredentialSourceSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  slug: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().optional().nullable(),
  isSystem: z.boolean().optional(),
});

export const CredentialSourceFilterSchema = PaginationQuerySchema.extend({
  isActive: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  isSystem: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
});

// DTO schemas only — types moved to certificate-configuration.types.ts

// ==========================================
// 3. ProviderType DTOs
// ==========================================
export const CreateProviderTypeSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z.string().trim().min(1).max(80),
  description: z.string().trim().optional(),
  isSystem: z.boolean().optional().default(false),
});

export const UpdateProviderTypeSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  slug: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().optional().nullable(),
  isSystem: z.boolean().optional(),
});

export const ProviderTypeFilterSchema = PaginationQuerySchema.extend({
  isActive: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  isSystem: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
});

// DTO schemas only — types moved to certificate-configuration.types.ts

// TEMPLATE DTOs REMOVED — moved to template-management module

// ==========================================
// 5. CertificateTemplateSigner DTOs
// ==========================================
export const CreateCertificateTemplateSignerSchema = z.object({
  employeeId: z.string().trim().min(1).max(20),
  displayOrder: z.number().int().min(1),
});

export const UpdateCertificateTemplateSignerSchema = z.object({
  employeeId: z.string().trim().min(1).max(20).optional(),
  displayOrder: z.number().int().min(1).optional(),
});

// DTO schemas only — types moved to certificate-configuration.types.ts
