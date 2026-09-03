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
