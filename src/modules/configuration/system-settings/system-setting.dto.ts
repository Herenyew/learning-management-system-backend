import { z } from 'zod';

export const CreateSystemSettingSchema = z.object({
  category: z.string(),
  settingKey: z.string().min(1),
  settingValue: z.any(),
  description: z.string().optional(),
});

export const UpdateSystemSettingSchema = z.object({
  settingValue: z.any().optional(),
  description: z.string().optional(),
});

export const QueryListSchema = z.object({
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().optional(),
  search: z.string().optional(),
  category: z.string().optional(),
});

export type CreateSystemSettingDto = z.infer<typeof CreateSystemSettingSchema>;
export type UpdateSystemSettingDto = z.infer<typeof UpdateSystemSettingSchema>;
