import { z } from "zod";
import {
  createCourseCategorySchema,
  updateCourseCategorySchema,
  courseCategoryFilterQuerySchema,
  createDifficultyLevelSchema,
  updateDifficultyLevelSchema,
  difficultyLevelFilterQuerySchema,
  createContentTypeSchema,
  updateContentTypeSchema,
  contentTypeFilterQuerySchema,
  createContentFileTypeSchema,
  updateContentFileTypeSchema,
  contentFileTypeFilterQuerySchema,
} from "./course-configuration.dto.js";

export type CreateCourseCategoryInput = z.infer<typeof createCourseCategorySchema>;
export type UpdateCourseCategoryInput = z.infer<typeof updateCourseCategorySchema>;
export type CourseCategoryFilterQuery = z.infer<typeof courseCategoryFilterQuerySchema>;
export interface CourseCategoryFilterParams {
  companyId: number;
  search?: string;
  isActive?: boolean;
  parentId?: number | null;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
export type CourseCategoryFilter = CourseCategoryFilterParams;

export type CreateDifficultyLevelInput = z.infer<typeof createDifficultyLevelSchema>;
export type UpdateDifficultyLevelInput = z.infer<typeof updateDifficultyLevelSchema>;
export type DifficultyLevelFilterQuery = z.infer<typeof difficultyLevelFilterQuerySchema>;

export interface DifficultyLevelFilterParams {
  companyId: number;
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
export type DifficultyLevelFilter = DifficultyLevelFilterParams;

export type CreateContentTypeInput = z.infer<typeof createContentTypeSchema>;
export type UpdateContentTypeInput = z.infer<typeof updateContentTypeSchema>;
export type ContentTypeFilterQuery = z.infer<typeof contentTypeFilterQuerySchema>;

export interface ContentTypeFilterParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
export type ContentTypeFilter = ContentTypeFilterParams;

export type CreateContentFileTypeInput = z.infer<typeof createContentFileTypeSchema>;
export type UpdateContentFileTypeInput = z.infer<typeof updateContentFileTypeSchema>;
export type ContentFileTypeFilterQuery = z.infer<typeof contentFileTypeFilterQuerySchema>;

export interface ContentFileTypeFilterParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
export type ContentFileTypeFilter = ContentFileTypeFilterParams;

import type { Prisma, CourseCategory, DifficultyLevel, ContentType, ContentFileType } from "@prisma/client";

export interface ICourseConfigurationRepository {
  countCategoryChildren(id: number, companyId: number): Promise<number>;
  createCategory(data: Prisma.CourseCategoryCreateInput): Promise<CourseCategory>;
  findCategoryById(id: number, companyId: number): Promise<CourseCategory | null>;
  findCategoryByName(companyId: number, name: string): Promise<CourseCategory | null>;
  findCategoryBySlug(companyId: number, slug: string): Promise<CourseCategory | null>;
  findCategories(filter: CourseCategoryFilterParams, page: number, pageSize: number): Promise<CourseCategory[]>;
  countCategories(filter: CourseCategoryFilterParams): Promise<number>;
  updateCategory(id: number, companyId: number, data: Prisma.CourseCategoryUpdateInput): Promise<CourseCategory>;
  softDeleteCategory(id: number, companyId: number): Promise<CourseCategory>;
  countCategoryUsages(id: number, companyId: number): Promise<number>;

  createDifficultyLevel(data: Prisma.DifficultyLevelCreateInput): Promise<DifficultyLevel>;
  findDifficultyLevelById(id: number, companyId: number): Promise<DifficultyLevel | null>;
  findDifficultyLevelByName(companyId: number, name: string): Promise<DifficultyLevel | null>;
  findDifficultyLevels(filter: DifficultyLevelFilterParams, page: number, pageSize: number): Promise<DifficultyLevel[]>;
  countDifficultyLevels(filter: DifficultyLevelFilterParams): Promise<number>;
  updateDifficultyLevel(id: number, companyId: number, data: Prisma.DifficultyLevelUpdateInput): Promise<DifficultyLevel>;
  softDeleteDifficultyLevel(id: number, companyId: number): Promise<DifficultyLevel>;
  countDifficultyLevelUsages(id: number, companyId: number): Promise<number>;

  createContentType(data: Prisma.ContentTypeCreateInput): Promise<ContentType>;
  findContentTypeById(id: number): Promise<ContentType | null>;
  findContentTypeByName(name: string): Promise<ContentType | null>;
  findContentTypes(filter: ContentTypeFilterParams, page: number, pageSize: number): Promise<ContentType[]>;
  countContentTypes(filter: ContentTypeFilterParams): Promise<number>;
  updateContentType(id: number, data: Prisma.ContentTypeUpdateInput): Promise<ContentType>;
  softDeleteContentType(id: number): Promise<ContentType>;
  countContentTypeUsages(id: number): Promise<number>;

  createContentFileType(data: Prisma.ContentFileTypeCreateInput): Promise<ContentFileType>;
  findContentFileTypeById(id: number): Promise<ContentFileType | null>;
  findContentFileTypeByName(name: string): Promise<ContentFileType | null>;
  findContentFileTypes(filter: ContentFileTypeFilterParams, page: number, pageSize: number): Promise<ContentFileType[]>;
  countContentFileTypes(filter: ContentFileTypeFilterParams): Promise<number>;
  updateContentFileType(id: number, data: Prisma.ContentFileTypeUpdateInput): Promise<ContentFileType>;
  softDeleteContentFileType(id: number): Promise<ContentFileType>;
  countContentFileTypeUsages(id: number): Promise<number>;

}
