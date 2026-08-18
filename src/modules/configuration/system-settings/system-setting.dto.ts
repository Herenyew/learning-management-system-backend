import { z } from 'zod';
import { $Enums } from '@prisma/client';

export const CreateSystemSettingSchema = z.object({
  category: z.nativeEnum($Enums.SettingCategory),
  settingKey: z.string().min(1),
  settingValue: z.any(),
  description: z.string().optional(),
});

export const UpdateSystemSettingSchema = z.object({
  settingValue: z.any().optional(),
  description: z.string().optional(),
});

export const QueryListSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  category: z.nativeEnum($Enums.SettingCategory).optional(),
});

// DTO schemas only — types moved to system-setting.types.ts
