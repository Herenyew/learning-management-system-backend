import { z } from "zod";
import {
  idParamSchema,
  createEffectivenessWeightConfigSchema,
  updateEffectivenessWeightConfigSchema,
  effectivenessWeightConfigFilterSchema,
} from "./training-effectiveness.dto.js";

export type IdParamInput = z.infer<typeof idParamSchema>;
export type CreateEffectivenessWeightConfigInput = z.infer<typeof createEffectivenessWeightConfigSchema>;
export type UpdateEffectivenessWeightConfigInput = z.infer<typeof updateEffectivenessWeightConfigSchema>;
export type EffectivenessWeightConfigFilterInput = z.infer<typeof effectivenessWeightConfigFilterSchema>;
export interface EffectivenessWeightConfigFilterParams {
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

import type { Prisma, EffectivenessWeightConfig } from "@prisma/client";

export interface ITrainingEffectivenessRepository {
  createWeightConfig(companyId: number, userId: number, dto: CreateEffectivenessWeightConfigInput): Promise<EffectivenessWeightConfig>;
  findWeightConfigById(companyId: number, id: number): Promise<EffectivenessWeightConfig | null>;
  findActiveWeightConfig(companyId: number): Promise<EffectivenessWeightConfig | null>;
  findWeightConfigs(companyId: number, filter: EffectivenessWeightConfigFilterParams): Promise<EffectivenessWeightConfig[]>;
  countWeightConfigs(companyId: number, filter: EffectivenessWeightConfigFilterParams): Promise<number>;
  updateWeightConfig(companyId: number, id: number, dto: UpdateEffectivenessWeightConfigInput): Promise<EffectivenessWeightConfig>;
  deactivateWeightConfig(companyId: number, id: number): Promise<EffectivenessWeightConfig>;
  deactivateAllActiveConfigs(companyId: number, prismaTx?: Prisma.TransactionClient): Promise<Prisma.BatchPayload>;
}
