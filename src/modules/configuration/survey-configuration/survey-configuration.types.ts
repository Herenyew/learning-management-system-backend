import { z } from "zod";
import {
  CreateSurveyQuestionTypeSchema,
  UpdateSurveyQuestionTypeSchema,
  CreateSurveyTemplateSchema,
  UpdateSurveyTemplateSchema,
  QueryListSchema,
} from "./survey-configuration.dto.js";

export type CreateSurveyQuestionTypeInput = z.infer<typeof CreateSurveyQuestionTypeSchema>;
export type UpdateSurveyQuestionTypeInput = z.infer<typeof UpdateSurveyQuestionTypeSchema>;
export type CreateSurveyTemplateInput = z.infer<typeof CreateSurveyTemplateSchema>;
export type UpdateSurveyTemplateInput = z.infer<typeof UpdateSurveyTemplateSchema>;
export type QueryListInput = z.infer<typeof QueryListSchema>;

import { Prisma } from "@prisma/client";

export interface SurveyQuestionTypeFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface SurveyTemplateFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export type SurveyQuestionType = Prisma.SurveyQuestionTypeGetPayload<{}>;
export type SurveyTemplate = Prisma.SurveyTemplateGetPayload<{}>;

export type PaginatedSurveyQuestionTypeResult = {
  items: SurveyQuestionType[];
  total: number;
  page: number;
  pageSize: number;
};

export type PaginatedSurveyTemplateResult = {
  items: SurveyTemplate[];
  total: number;
  page: number;
  pageSize: number;
};

export interface ISurveyConfigurationRepository {
  createSurveyQuestionType(companyId: number, data: CreateSurveyQuestionTypeInput): Promise<SurveyQuestionType>;
  findSurveyQuestionTypeById(companyId: number, id: number): Promise<SurveyQuestionType | null>;
  findSurveyQuestionTypeByName(companyId: number, name: string): Promise<SurveyQuestionType | null>;
  findSurveyQuestionTypes(companyId: number, query: SurveyQuestionTypeFilterParams): Promise<PaginatedSurveyQuestionTypeResult>;
  countSurveyQuestionTypes(companyId: number): Promise<number>;
  updateSurveyQuestionType(companyId: number, id: number, data: UpdateSurveyQuestionTypeInput): Promise<Prisma.BatchPayload>;
  softDeleteSurveyQuestionType(companyId: number, id: number): Promise<Prisma.BatchPayload>;
  countSurveyQuestionTypeUsages(companyId: number, id: number): Promise<number>;

  createTemplate(companyId: number, userId: number, data: CreateSurveyTemplateInput): Promise<SurveyTemplate>;
  findTemplateById(companyId: number, id: number): Promise<SurveyTemplate | null>;
  findTemplateByName(companyId: number, name: string): Promise<SurveyTemplate | null>;
  findTemplates(companyId: number, query: SurveyTemplateFilterParams): Promise<PaginatedSurveyTemplateResult>;
  countTemplates(companyId: number): Promise<number>;
  updateTemplate(companyId: number, id: number, userId: number, data: UpdateSurveyTemplateInput): Promise<SurveyTemplate>;
  softDeleteTemplate(companyId: number, id: number): Promise<Prisma.BatchPayload>;
  countTemplateUsages(companyId: number, id: number): Promise<number>;
}
