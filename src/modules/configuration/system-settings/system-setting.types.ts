import { z } from "zod";
import {
  CreateSystemSettingSchema,
  UpdateSystemSettingSchema,
  QueryListSchema,
  BulkUpdateSettingSchema,
} from "./system-setting.dto.js";

export type CreateSystemSettingInput = z.infer<typeof CreateSystemSettingSchema>;
export type UpdateSystemSettingInput = z.infer<typeof UpdateSystemSettingSchema>;
export type BulkUpdateSettingInput = z.infer<typeof BulkUpdateSettingSchema>;
export type QueryListInput = z.infer<typeof QueryListSchema>;

import { Prisma } from "@prisma/client";
import type { SettingCategory, SettingValueType } from "@prisma/client";

export interface SystemSettingFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: SettingCategory;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/** API shape sent to clients. Secret values are masked / never returned. */
export type SystemSettingDto = {
  id: number;
  companyId: number;
  category: SettingCategory;
  settingKey: string;
  settingValue: unknown;
  valueType: SettingValueType;
  description: string | null;
  isActive: boolean;
  createdBy: number | null;
  updatedBy: number;
  createdAt: string;
  updatedAt: string;
};

export type SystemSetting = Prisma.SystemSettingGetPayload<{}>;

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type PaginatedSystemSetting = Paginated<SystemSetting>;

export type PaginatedSystemSettingResult = Paginated<SystemSettingDto>;

/** A single entity referenced by a bulk update payload. */
export type BulkUpdateItem = {
  id?: number;
  settingKey?: string;
  settingValue?: unknown;
  isActive?: boolean;
};

export interface ISystemSettingRepository {
  create(companyId: number, userId: number, data: CreateSystemSettingInput): Promise<SystemSetting>;
  findById(companyId: number, id: number): Promise<SystemSetting | null>;
  findByKey(companyId: number, key: string): Promise<SystemSetting | null>;
  findMany(companyId: number, query: SystemSettingFilterParams): Promise<PaginatedSystemSetting>;
  countMany(companyId: number): Promise<number>;
  update(companyId: number, id: number, userId: number, data: UpdateSystemSettingInput): Promise<SystemSetting>;
  bulkUpdate(companyId: number, userId: number, items: BulkUpdateItem[]): Promise<SystemSetting[]>;
  delete(companyId: number, id: number): Promise<SystemSetting>;
}
