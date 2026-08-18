import { z } from "zod";
import {
  CreateSystemSettingSchema,
  UpdateSystemSettingSchema,
  QueryListSchema,
} from "./system-setting.dto.js";

export type CreateSystemSettingInput = z.infer<typeof CreateSystemSettingSchema>;
export type UpdateSystemSettingInput = z.infer<typeof UpdateSystemSettingSchema>;
export type QueryListInput = z.infer<typeof QueryListSchema>;

import { Prisma } from "@prisma/client";
import type { SettingCategory } from "@prisma/client";

export interface SystemSettingFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: SettingCategory;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export type SystemSetting = Prisma.SystemSettingGetPayload<{}>;

export type PaginatedSystemSettingResult = {
  items: SystemSetting[];
  total: number;
  page: number;
  pageSize: number;
};

export interface ISystemSettingRepository {
  create(companyId: number, userId: number, data: CreateSystemSettingInput): Promise<SystemSetting>;
  findById(companyId: number, id: number): Promise<SystemSetting | null>;
  findByKey(companyId: number, key: string): Promise<SystemSetting | null>;
  findMany(companyId: number, query: SystemSettingFilterParams): Promise<PaginatedSystemSettingResult>;
  countMany(companyId: number): Promise<number>;
  update(companyId: number, id: number, userId: number, data: UpdateSystemSettingInput): Promise<SystemSetting>;
  delete(companyId: number, id: number): Promise<SystemSetting>;
}
