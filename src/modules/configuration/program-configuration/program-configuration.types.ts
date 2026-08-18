import type {
  Prisma,
  ProgramType,
  ProgramCategory,
  TaskType,
  ProgramTemplate,
} from "@prisma/client";
import { z } from "zod";
import {
  paginationQuerySchema,
  idParamSchema,
  createProgramTypeSchema,
  updateProgramTypeSchema,
  programTypeQuerySchema,
  createProgramCategorySchema,
  updateProgramCategorySchema,
  programCategoryQuerySchema,
  createTaskTypeSchema,
  updateTaskTypeSchema,
  taskTypeQuerySchema,
  createProgramTemplateSchema,
  updateProgramTemplateSchema,
  programTemplateQuerySchema,
} from "./program-configuration.dto.js";

// -----------------------------------------------------------------------------
// Inferred Input Types
// -----------------------------------------------------------------------------
export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;
export type IdParamInput = z.infer<typeof idParamSchema>;

export type CreateProgramTypeInput = z.infer<typeof createProgramTypeSchema>;
export type UpdateProgramTypeInput = z.infer<typeof updateProgramTypeSchema>;
export type ProgramTypeQueryInput = z.infer<typeof programTypeQuerySchema>;

export type CreateProgramCategoryInput = z.infer<typeof createProgramCategorySchema>;
export type UpdateProgramCategoryInput = z.infer<typeof updateProgramCategorySchema>;
export type ProgramCategoryQueryInput = z.infer<typeof programCategoryQuerySchema>;

export type CreateTaskTypeInput = z.infer<typeof createTaskTypeSchema>;
export type UpdateTaskTypeInput = z.infer<typeof updateTaskTypeSchema>;
export type TaskTypeQueryInput = z.infer<typeof taskTypeQuerySchema>;

export type CreateProgramTemplateInput = z.infer<typeof createProgramTemplateSchema>;
export type UpdateProgramTemplateInput = z.infer<typeof updateProgramTemplateSchema>;
export type ProgramTemplateQueryInput = z.infer<typeof programTemplateQuerySchema>;

// -----------------------------------------------------------------------------
// Explicit Filter Interfaces
// -----------------------------------------------------------------------------
export interface ProgramTypeFilterParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ProgramCategoryFilterParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface TaskTypeFilterParams {
  search?: string;
  slug?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ProgramTemplateFilterParams {
  search?: string;
  programTypeId?: number;
  programCategoryId?: number;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// -----------------------------------------------------------------------------
// Repository Interface Contract
// -----------------------------------------------------------------------------
export interface IProgramConfigurationRepository {
  // Program Type
  createProgramType(companyId: number, data: CreateProgramTypeInput): Promise<ProgramType>;
  findProgramTypeById(companyId: number, id: number): Promise<ProgramType | null>;
  findProgramTypeByName(companyId: number, name: string): Promise<ProgramType | null>;
  findProgramTypes(
    companyId: number,
    filter: ProgramTypeFilterParams
  ): Promise<{ items: ProgramType[]; total: number; page: number; pageSize: number }>;
  countProgramTypes(companyId: number): Promise<number>;
  updateProgramType(companyId: number, id: number, data: UpdateProgramTypeInput): Promise<ProgramType>;
  softDeleteProgramType(companyId: number, id: number): Promise<ProgramType>;
  countProgramTypeUsages(companyId: number, id: number): Promise<number>;

  // Program Category
  createProgramCategory(companyId: number, userId: number, data: CreateProgramCategoryInput): Promise<ProgramCategory>;
  findProgramCategoryById(companyId: number, id: number): Promise<ProgramCategory | null>;
  findProgramCategoryByName(companyId: number, name: string): Promise<ProgramCategory | null>;
  findProgramCategories(
    companyId: number,
    filter: ProgramCategoryFilterParams
  ): Promise<{ items: ProgramCategory[]; total: number; page: number; pageSize: number }>;
  countProgramCategories(companyId: number): Promise<number>;
  updateProgramCategory(
    companyId: number,
    id: number,
    userId: number,
    data: UpdateProgramCategoryInput
  ): Promise<ProgramCategory>;
  softDeleteProgramCategory(companyId: number, id: number): Promise<ProgramCategory>;
  countProgramCategoryUsages(companyId: number, id: number): Promise<number>;

  // Task Type
  createTaskType(companyId: number, data: CreateTaskTypeInput & { slug: string }): Promise<TaskType>;
  findTaskTypeById(companyId: number, id: number): Promise<TaskType | null>;
  findTaskTypeByName(companyId: number, name: string): Promise<TaskType | null>;
  findTaskTypeBySlug(companyId: number, slug: string): Promise<TaskType | null>;
  findTaskTypes(
    companyId: number,
    filter: TaskTypeFilterParams
  ): Promise<{ items: TaskType[]; total: number; page: number; pageSize: number }>;
  countTaskTypes(companyId: number): Promise<number>;
  updateTaskType(companyId: number, id: number, data: UpdateTaskTypeInput): Promise<TaskType>;
  softDeleteTaskType(companyId: number, id: number): Promise<TaskType>;
  countTaskTypeUsages(companyId: number, id: number): Promise<number>;

  // Program Template
  createTemplate(companyId: number, userId: number, data: CreateProgramTemplateInput): Promise<ProgramTemplate>;
  findTemplateById(companyId: number, id: number): Promise<ProgramTemplate | null>;
  findTemplateByName(companyId: number, name: string): Promise<ProgramTemplate | null>;
  findTemplates(
    companyId: number,
    filter: ProgramTemplateFilterParams
  ): Promise<{ items: ProgramTemplate[]; total: number; page: number; pageSize: number }>;
  countTemplates(companyId: number): Promise<number>;
  updateTemplate(
    companyId: number,
    id: number,
    userId: number,
    data: UpdateProgramTemplateInput
  ): Promise<ProgramTemplate>;
  softDeleteTemplate(companyId: number, id: number): Promise<ProgramTemplate>;
  countTemplateUsages(companyId: number, id: number): Promise<number>;
}