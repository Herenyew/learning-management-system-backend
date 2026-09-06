import { z } from "zod";
import {
  createAssessmentTypeSchema,
  updateAssessmentTypeSchema,
  assessmentTypeFilterSchema,
  createQuestionTypeSchema,
  updateQuestionTypeSchema,
  questionTypeFilterSchema,
  createGradingMethodSchema,
  updateGradingMethodSchema,
  gradingMethodFilterSchema,
} from "./assessment-configuration.dto.js";

import { QuestionAnswerStructure } from "@prisma/client";

export type CreateAssessmentTypeInput = z.infer<typeof createAssessmentTypeSchema>;
export type UpdateAssessmentTypeInput = z.infer<typeof updateAssessmentTypeSchema>;
export type AssessmentTypeFilterInput = z.infer<typeof assessmentTypeFilterSchema>;
export interface AssessmentTypeFilterParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export type CreateQuestionTypeInput = z.infer<typeof createQuestionTypeSchema>;
export type UpdateQuestionTypeInput = z.infer<typeof updateQuestionTypeSchema>;
export type QuestionTypeFilterInput = z.infer<typeof questionTypeFilterSchema>;
export interface QuestionTypeFilterParams {
  search?: string;
  isActive?: boolean;
  answerStructure?:QuestionAnswerStructure;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export type CreateGradingMethodInput = z.infer<typeof createGradingMethodSchema>;
export type UpdateGradingMethodInput = z.infer<typeof updateGradingMethodSchema>;
export type GradingMethodFilterInput = z.infer<typeof gradingMethodFilterSchema>;
export interface GradingMethodFilterParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

import type { Prisma, AssessmentType, QuestionType, GradingMethod } from "@prisma/client";

export interface IAssessmentConfigurationRepository {
  createAssessmentType(data: Prisma.AssessmentTypeCreateInput): Promise<AssessmentType>;
  findAssessmentTypeById(id: number, companyId: number): Promise<AssessmentType | null>;
  findAssessmentTypeByCode(code: string, companyId: number): Promise<AssessmentType | null>;
  findAssessmentTypes(filter: AssessmentTypeFilterParams, companyId: number): Promise<AssessmentType[]>;
  countAssessmentTypes(filter: AssessmentTypeFilterParams, companyId: number): Promise<number>;
  updateAssessmentType(id: number, companyId: number, data: Prisma.AssessmentTypeUpdateInput): Promise<AssessmentType>;
  deleteAssessmentType(id: number, companyId: number): Promise<AssessmentType>;
  countAssessmentTypeUsages(id: number, companyId: number): Promise<number>;

  createQuestionType(data: Prisma.QuestionTypeCreateInput): Promise<QuestionType>;
  findQuestionTypeById(id: number, companyId: number): Promise<QuestionType | null>;
  findQuestionTypeByName(name: string, companyId: number): Promise<QuestionType | null>;
  findQuestionTypeBySlug(slug: string, companyId: number): Promise<QuestionType | null>;
  findQuestionTypes(filter: QuestionTypeFilterParams, companyId: number): Promise<QuestionType[]>;
  countQuestionTypes(filter: QuestionTypeFilterParams, companyId: number): Promise<number>;
  updateQuestionType(id: number, companyId: number, data: Prisma.QuestionTypeUpdateInput): Promise<QuestionType>;
  deleteQuestionType(id: number, companyId: number): Promise<QuestionType>;
  countQuestionTypeUsages(id: number, companyId: number): Promise<number>;

  createGradingMethod(data: Prisma.GradingMethodCreateInput): Promise<GradingMethod>;
  findGradingMethodById(id: number, companyId: number): Promise<GradingMethod | null>;
  findGradingMethodByName(name: string, companyId: number): Promise<GradingMethod | null>;
  findGradingMethodBySlug(slug: string, companyId: number): Promise<GradingMethod | null>;
  findGradingMethods(filter: GradingMethodFilterParams, companyId: number): Promise<GradingMethod[]>;
  countGradingMethods(filter: GradingMethodFilterParams, companyId: number): Promise<number>;
  updateGradingMethod(id: number, companyId: number, data: Prisma.GradingMethodUpdateInput): Promise<GradingMethod>;
  deleteGradingMethod(id: number, companyId: number): Promise<GradingMethod>;
  countGradingMethodUsages(id: number, companyId: number): Promise<number>;
}
