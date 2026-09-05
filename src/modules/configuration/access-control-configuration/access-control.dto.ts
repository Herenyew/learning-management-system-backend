import { z } from "zod";

export const roleIdParamsSchema = z.object({
  roleId: z.coerce.number().int().positive(),
});

export const updateRolePermissionsSchema = z
  .object({
    permissionCodes: z.array(z.string().trim().min(1).max(100)).max(250),
  })
  .strict()
  .transform(({ permissionCodes }) => ({
    permissionCodes: [...new Set(permissionCodes)].sort(),
  }));

export type UpdateRolePermissionsInput = z.infer<typeof updateRolePermissionsSchema>;

// ─── EMS Mapping DTOs ─────────────────────────────────────────────────────────

export const createEmsMappingSchema = z.object({
  emsRoleName: z.string().min(1).max(100).trim(),
  appRoleId:   z.number().int().positive(),
  autoAssign:  z.boolean().optional().default(true),
  priority:    z.number().int().min(0).max(100).optional().default(0),
});

export const updateEmsMappingSchema = createEmsMappingSchema.partial();

export type CreateEmsMappingInput = z.infer<typeof createEmsMappingSchema>;
export type UpdateEmsMappingInput = z.infer<typeof updateEmsMappingSchema>;

// ─── Permission Group DTOs ────────────────────────────────────────────────────

export const createPermissionGroupSchema = z.object({
  name:        z.string().min(1).max(100).trim(),
  description: z.string().max(500).optional(),
  module:      z.string().min(1).max(50).trim(),
});

export const updatePermissionGroupSchema = createPermissionGroupSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const assignPermissionsToGroupSchema = z.object({
  permissionIds: z.array(z.number().int().positive()).min(1).max(250),
});

export type CreatePermissionGroupInput = z.infer<typeof createPermissionGroupSchema>;
export type UpdatePermissionGroupInput = z.infer<typeof updatePermissionGroupSchema>;

// ─── User Role Assignment DTOs ────────────────────────────────────────────────

export const assignRoleToUserSchema = z.object({
  roleId:    z.number().int().positive(),
  isManual:  z.boolean().optional().default(true),
  notes:     z.string().max(500).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const bulkAssignRoleSchema = z.object({
  roleId:  z.number().int().positive(),
  userIds: z.array(z.number().int().positive()).min(1).max(500),
});

export type AssignRoleToUserInput = z.infer<typeof assignRoleToUserSchema>;
export type BulkAssignRoleInput  = z.infer<typeof bulkAssignRoleSchema>;

// ─── EMS Sync DTO ──────────────────────────────────────────────────────

export const syncFromEmsSchema = z.object({
  emsUsers: z.array(
    z.object({
      userId: z.number().int().positive(),
      emsRoleName: z.string().min(1).max(100).trim(),
    }),
  ),
});

export type SyncFromEmsInput = z.infer<typeof syncFromEmsSchema>;

// ─── Role Management DTOs ─────────────────────────────────────────────────

export const createRoleSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateRoleSchema = createRoleSchema.partial();

export const roleStatusSchema = z.object({
  isActive: z.boolean(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

export const roleIdAndPermissionIdSchema = z.object({
  roleId: z.coerce.number().int().positive(),
  permissionId: z.coerce.number().int().positive(),
});

export const bulkAssignPermissionsSchema = z.object({
  permissionIds: z.array(z.number().int().positive()).min(1).max(250),
});

export const bulkRevokePermissionsSchema = z.object({
  permissionIds: z.array(z.number().int().positive()).min(1).max(250),
});

export const listPermissionsQuerySchema = z.object({
  module: z.string().optional(),
});

export const permissionIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type BulkAssignPermissionsInput = z.infer<typeof bulkAssignPermissionsSchema>;
export type BulkRevokePermissionsInput = z.infer<typeof bulkRevokePermissionsSchema>;

// ─── Permission Management DTOs ───────────────────────────────────────────

export const createPermissionSchema = z.object({
  code: z.string().min(1).max(100).trim(),
  description: z.string().max(500).optional(),
  module: z.string().min(1).max(50).trim(),
  groupId: z.number().int().positive().optional(),
});

export const updatePermissionSchema = createPermissionSchema.partial().extend({
  groupId: z.number().nullable().optional(),
});

export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;
