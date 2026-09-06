import { z } from "zod";
import {
  CreateSurveyQuestionTypeSchema,
  UpdateSurveyQuestionTypeSchema,
  QueryListSchema,
} from "./survey-configuration.dto.js";

export type CreateSurveyQuestionTypeInput = z.infer<typeof CreateSurveyQuestionTypeSchema>;
export type UpdateSurveyQuestionTypeInput = z.infer<typeof UpdateSurveyQuestionTypeSchema>;
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

export type ConfigJson = Record<string, unknown>;

export type SurveyQuestionType = Prisma.SurveyQuestionTypeGetPayload<{}>;

export type PaginatedSurveyQuestionTypeResult = {
  items: SurveyQuestionType[];
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
}
