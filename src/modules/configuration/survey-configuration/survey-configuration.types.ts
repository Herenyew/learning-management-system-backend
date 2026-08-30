import { z } from "zod";
import {
  CreateSurveyQuestionTypeSchema,
  UpdateSurveyQuestionTypeSchema,
  CreateSurveyTemplateSchema,
  UpdateSurveyTemplateSchema,
  CreateSurveyTemplateQuestionSchema,
  UpdateSurveyTemplateQuestionSchema,
  ReorderSurveyTemplateQuestionsSchema,
  QueryListSchema,
} from "./survey-configuration.dto.js";

export type CreateSurveyQuestionTypeInput = z.infer<typeof CreateSurveyQuestionTypeSchema>;
export type UpdateSurveyQuestionTypeInput = z.infer<typeof UpdateSurveyQuestionTypeSchema>;
export type CreateSurveyTemplateInput = z.infer<typeof CreateSurveyTemplateSchema>;
export type UpdateSurveyTemplateInput = z.infer<typeof UpdateSurveyTemplateSchema>;
export type QueryListInput = z.infer<typeof QueryListSchema>;

export type CreateSurveyTemplateQuestionInput = z.infer<typeof CreateSurveyTemplateQuestionSchema>;
export type UpdateSurveyTemplateQuestionInput = z.infer<typeof UpdateSurveyTemplateQuestionSchema>;
export type ReorderSurveyTemplateQuestionsInput = z.infer<typeof ReorderSurveyTemplateQuestionsSchema>;

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

export type ConfigJson = Record<string, unknown>;

export type SurveyQuestionType = Prisma.SurveyQuestionTypeGetPayload<{}>;
export type SurveyTemplate = Prisma.SurveyTemplateGetPayload<{}>;
export type SurveyTemplateQuestion = Prisma.SurveyTemplateQuestionGetPayload<{
  include: { questionType: true };
}>;
export type SurveyTemplateWithQuestions = Prisma.SurveyTemplateGetPayload<{
  include: {
    questions: { orderBy: { displayOrder: "asc" }; include: { questionType: true } };
  };
}>;

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

  createTemplate(companyId: number, userId: number, data: CreateSurveyTemplateInput): Promise<SurveyTemplateWithQuestions>;
  findTemplateById(companyId: number, id: number): Promise<SurveyTemplateWithQuestions | null>;
  findTemplateByName(companyId: number, name: string): Promise<SurveyTemplate | null>;
  findTemplates(companyId: number, query: SurveyTemplateFilterParams): Promise<PaginatedSurveyTemplateResult>;
  countTemplates(companyId: number): Promise<number>;
  updateTemplate(companyId: number, id: number, userId: number, data: UpdateSurveyTemplateInput): Promise<SurveyTemplateWithQuestions>;
  softDeleteTemplate(companyId: number, id: number): Promise<Prisma.BatchPayload>;
  countTemplateUsages(companyId: number, id: number): Promise<number>;

  // ─── Survey Template Questions (Dynamic Question Builder) ─────────────────
  createTemplateQuestion(
    companyId: number,
    templateId: number,
    data: CreateSurveyTemplateQuestionInput & { displayOrder: number },
  ): Promise<SurveyTemplateQuestion>;
  findTemplateQuestions(companyId: number, templateId: number): Promise<SurveyTemplateQuestion[]>;
  findTemplateQuestionById(companyId: number, templateId: number, id: number): Promise<SurveyTemplateQuestion | null>;
  findMaxTemplateQuestionOrder(companyId: number, templateId: number): Promise<number>;
  updateTemplateQuestion(companyId: number, templateId: number, id: number, data: UpdateSurveyTemplateQuestionInput): Promise<SurveyTemplateQuestion>;
  deleteTemplateQuestion(companyId: number, templateId: number, id: number): Promise<SurveyTemplateQuestion>;
  reorderTemplateQuestions(
    companyId: number,
    templateId: number,
    items: ReorderSurveyTemplateQuestionsInput["questions"],
  ): Promise<SurveyTemplateQuestion[]>;
}
