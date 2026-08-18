import { z } from "zod";
import {
  idParamSchema,
  CreateTnaRequestTypeSchema,
  UpdateTnaRequestTypeSchema,
  TnaRequestTypeFilterSchema,
  CreateFundingTypeSchema,
  UpdateFundingTypeSchema,
  FundingTypeFilterSchema,
  CreateTrainingFormatSchema,
  UpdateTrainingFormatSchema,
  TrainingFormatFilterSchema,
} from "./tna-configuration.dto.js";

export type IdParamInput = z.infer<typeof idParamSchema>;

export type CreateTnaRequestTypeInput = z.infer<typeof CreateTnaRequestTypeSchema>;
export type UpdateTnaRequestTypeInput = z.infer<typeof UpdateTnaRequestTypeSchema>;
export type TnaRequestTypeFilterInput = z.infer<typeof TnaRequestTypeFilterSchema>;
export interface TnaRequestTypeFilterParams {
  search?: string;
  isActive?: boolean;
  isSystem?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export type CreateFundingTypeInput = z.infer<typeof CreateFundingTypeSchema>;
export type UpdateFundingTypeInput = z.infer<typeof UpdateFundingTypeSchema>;
export type FundingTypeFilterInput = z.infer<typeof FundingTypeFilterSchema>;
export interface FundingTypeFilterParams {
  search?: string;
  isActive?: boolean;
  isSystem?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export type CreateTrainingFormatInput = z.infer<typeof CreateTrainingFormatSchema>;
export type UpdateTrainingFormatInput = z.infer<typeof UpdateTrainingFormatSchema>;
export type TrainingFormatFilterInput = z.infer<typeof TrainingFormatFilterSchema>;
export interface TrainingFormatFilterParams {
  search?: string;
  isActive?: boolean;
  isSystem?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

import type { Prisma, TnaRequestTypeConfig, FundingType, TrainingFormat } from "@prisma/client";

export interface ITnaConfigurationRepository {
  createRequestType(companyId: number, dto: CreateTnaRequestTypeInput): Promise<TnaRequestTypeConfig>;
  findRequestTypeById(companyId: number, id: number): Promise<TnaRequestTypeConfig | null>;
  findRequestTypeByName(companyId: number, name: string): Promise<TnaRequestTypeConfig | null>;
  findRequestTypes(companyId: number, filter: TnaRequestTypeFilterParams): Promise<TnaRequestTypeConfig[]>;
  countRequestTypes(companyId: number, filter: TnaRequestTypeFilterParams): Promise<number>;
  updateRequestType(companyId: number, id: number, dto: UpdateTnaRequestTypeInput): Promise<TnaRequestTypeConfig>;
  softDeleteRequestType(companyId: number, id: number): Promise<TnaRequestTypeConfig>;
  countRequestTypeUsages(companyId: number, id: number): Promise<number>;

  createFundingType(companyId: number, dto: CreateFundingTypeInput & { slug: string }): Promise<FundingType>;
  findFundingTypeById(companyId: number, id: number): Promise<FundingType | null>;
  findFundingTypeByName(companyId: number, name: string): Promise<FundingType | null>;
  findFundingTypeBySlug(companyId: number, slug: string): Promise<FundingType | null>;
  findFundingTypes(companyId: number, filter: FundingTypeFilterParams): Promise<FundingType[]>;
  countFundingTypes(companyId: number, filter: FundingTypeFilterParams): Promise<number>;
  updateFundingType(companyId: number, id: number, dto: UpdateFundingTypeInput & { slug?: string }): Promise<FundingType>;
  softDeleteFundingType(companyId: number, id: number): Promise<FundingType>;
  countFundingTypeUsages(companyId: number, id: number): Promise<number>;

  createTrainingFormat(companyId: number, dto: CreateTrainingFormatInput & { slug: string }): Promise<TrainingFormat>;
  findTrainingFormatById(companyId: number, id: number): Promise<TrainingFormat | null>;
  findTrainingFormatByName(companyId: number, name: string): Promise<TrainingFormat | null>;
  findTrainingFormatBySlug(companyId: number, slug: string): Promise<TrainingFormat | null>;
  findTrainingFormats(companyId: number, filter: TrainingFormatFilterParams): Promise<TrainingFormat[]>;
  countTrainingFormats(companyId: number, filter: TrainingFormatFilterParams): Promise<number>;
  updateTrainingFormat(companyId: number, id: number, dto: UpdateTrainingFormatInput & { slug?: string }): Promise<TrainingFormat>;
  softDeleteTrainingFormat(companyId: number, id: number): Promise<TrainingFormat>;
  countTrainingFormatUsages(companyId: number, id: number): Promise<number>;
}
