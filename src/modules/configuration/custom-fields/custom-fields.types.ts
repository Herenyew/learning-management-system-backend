import { z } from "zod";
import {
  createCustomFieldSchema,
  updateCustomFieldSchema,
  customFieldFilterSchema,
} from "./custom-fields.dto.js";
import { Prisma } from "@prisma/client";
import type { CustomFieldTarget } from "@prisma/client";

export type CreateCustomFieldInput = z.infer<typeof createCustomFieldSchema>;
export type UpdateCustomFieldInput = z.infer<typeof updateCustomFieldSchema>;
export type CustomFieldFilterInput = z.infer<typeof customFieldFilterSchema>;

export interface CustomFieldFilterParams {
  search?: string;
  target?: CreateCustomFieldInput["target"];
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export type CustomFieldDefinition = Prisma.CustomFieldDefinitionGetPayload<{}>;

export type PaginatedCustomFieldDefinitionResult = {
  data: CustomFieldDefinition[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};

export interface CustomFieldDefinitionUsage {
  entityId: number | string;
  fieldKey: string;
  value: any;
}

export interface ICustomFieldsRepository {
  createCustomFieldDefinition(companyId: number, userId: number, data: CreateCustomFieldInput): Promise<CustomFieldDefinition>;
  findCustomFieldDefinitionById(companyId: number, id: number): Promise<CustomFieldDefinition | null>;
  findCustomFieldDefinitionByKey(companyId: number, key: string, target: CustomFieldTarget): Promise<CustomFieldDefinition | null>;
  findCustomFieldDefinitions(companyId: number, query: CustomFieldFilterParams): Promise<PaginatedCustomFieldDefinitionResult>;
  countCustomFieldDefinitions(companyId: number, query: CustomFieldFilterParams): Promise<number>;
  updateCustomFieldDefinition(companyId: number, id: number, userId: number, data: UpdateCustomFieldInput): Promise<CustomFieldDefinition>;
  softDeleteCustomFieldDefinition(companyId: number, id: number, userId: number): Promise<CustomFieldDefinition>;
  findCustomFieldDefinitionUsages(companyId: number, id: number): Promise<CustomFieldDefinitionUsage[]>;
}
