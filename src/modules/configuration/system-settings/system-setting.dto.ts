import { z } from 'zod';
import { $Enums } from '@prisma/client';
import { SettingValueType } from '@prisma/client';
import { SETTING_KEY_REGEX } from './known-settings.registry.js';

/**
 * Managed, type-safe System Setting schemas.
 *
 * Structure is validated here; valueType-aware value validation lives
 * in the service layer (validateSettingValue) because it is driven by
 * the Known Settings Registry at runtime.
 */

const settingValueTypeEnum = z.nativeEnum(SettingValueType);

export const CreateSystemSettingSchema = z.object({
  category: z.nativeEnum($Enums.SettingCategory),
  settingKey: z
    .string()
    .min(2)
    .max(150)
    .regex(SETTING_KEY_REGEX, "Key must start with a lowercase letter and contain only a-z, 0-9, '_', '.', '-'."),
  settingValue: z.unknown().optional(),
  valueType: settingValueTypeEnum,
  description: z.string().max(2000).optional(),
  isActive: z.boolean().optional(),
});

export const UpdateSystemSettingSchema = z.object({
  settingValue: z.unknown().optional(),
  valueType: settingValueTypeEnum.optional(),
  description: z.string().max(2000).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const BulkUpdateSettingSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.number().int().positive().optional(),
        settingKey: z.string().min(1).max(150).optional(),
        settingValue: z.unknown().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .min(1)
    .max(200),
});

export const QueryListSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(1000).optional(),
  search: z.string().optional(),
  category: z.nativeEnum($Enums.SettingCategory).optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

// DTO schemas only — types moved to system-setting.types.ts
export type SettingValueTypeEnum = z.infer<typeof settingValueTypeEnum>;
