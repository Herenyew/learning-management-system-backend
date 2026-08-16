import { PrismaClient, Prisma, EffectivenessWeightConfig } from "@prisma/client";
import {
  CreateEffectivenessWeightConfigDto,
  UpdateEffectivenessWeightConfigDto,
  EffectivenessWeightConfigFilterDto,
} from "./training-effectiveness.dto.js";

export interface ITrainingEffectivenessRepository {
  createWeightConfig(
    companyId: number,
    userId: number,
    dto: CreateEffectivenessWeightConfigDto
  ): Promise<EffectivenessWeightConfig>;
  findWeightConfigById(
    companyId: number,
    id: number
  ): Promise<EffectivenessWeightConfig | null>;
  findActiveWeightConfig(
    companyId: number
  ): Promise<EffectivenessWeightConfig | null>;
  findWeightConfigs(
    companyId: number,
    filter: EffectivenessWeightConfigFilterDto
  ): Promise<EffectivenessWeightConfig[]>;
  countWeightConfigs(
    companyId: number,
    filter: EffectivenessWeightConfigFilterDto
  ): Promise<number>;
  updateWeightConfig(
    companyId: number,
    id: number,
    dto: UpdateEffectivenessWeightConfigDto
  ): Promise<EffectivenessWeightConfig>;
  deactivateWeightConfig(
    companyId: number,
    id: number
  ): Promise<EffectivenessWeightConfig>;
  deactivateAllActiveConfigs(
    companyId: number,
    prismaTx?: Prisma.TransactionClient
  ): Promise<Prisma.BatchPayload>;
}

export class TrainingEffectivenessRepository
  implements ITrainingEffectivenessRepository
{
  constructor(private prisma: PrismaClient) {}

  async createWeightConfig(
    companyId: number,
    userId: number,
    dto: CreateEffectivenessWeightConfigDto
  ): Promise<EffectivenessWeightConfig> {
    return this.prisma.effectivenessWeightConfig.create({
      data: {
        companyId,
        createdBy: userId,
        reactionWeight: dto.reactionWeight,
        learningWeight: dto.learningWeight,
        behaviorWeight: dto.behaviorWeight,
        resultsWeight: dto.resultsWeight,
        isActive: dto.isActive ?? true,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date(),
      },
    });
  }

  async findWeightConfigById(
    companyId: number,
    id: number
  ): Promise<EffectivenessWeightConfig | null> {
    return this.prisma.effectivenessWeightConfig.findFirst({
      where: { id, companyId },
    });
  }

  async findActiveWeightConfig(
    companyId: number
  ): Promise<EffectivenessWeightConfig | null> {
    return this.prisma.effectivenessWeightConfig.findFirst({
      where: { companyId, isActive: true },
      orderBy: { effectiveFrom: "desc" },
    });
  }

  async findWeightConfigs(
    companyId: number,
    filter: EffectivenessWeightConfigFilterDto
  ): Promise<EffectivenessWeightConfig[]> {
    const { isActive, page, limit } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.EffectivenessWeightConfigWhereInput = {
      companyId,
      ...(isActive !== undefined && { isActive }),
    };

    return this.prisma.effectivenessWeightConfig.findMany({
      where,
      skip,
      take: limit,
      orderBy: { effectiveFrom: "desc" },
    });
  }

  async countWeightConfigs(
    companyId: number,
    filter: EffectivenessWeightConfigFilterDto
  ): Promise<number> {
    const { isActive } = filter;

    const where: Prisma.EffectivenessWeightConfigWhereInput = {
      companyId,
      ...(isActive !== undefined && { isActive }),
    };

    return this.prisma.effectivenessWeightConfig.count({ where });
  }

  async updateWeightConfig(
    companyId: number,
    id: number,
    dto: UpdateEffectivenessWeightConfigDto
  ): Promise<EffectivenessWeightConfig> {
    return this.prisma.effectivenessWeightConfig.update({
      where: { id },
      data: {
        ...(dto.reactionWeight !== undefined && { reactionWeight: dto.reactionWeight }),
        ...(dto.learningWeight !== undefined && { learningWeight: dto.learningWeight }),
        ...(dto.behaviorWeight !== undefined && { behaviorWeight: dto.behaviorWeight }),
        ...(dto.resultsWeight !== undefined && { resultsWeight: dto.resultsWeight }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.effectiveFrom && { effectiveFrom: new Date(dto.effectiveFrom) }),
      },
    });
  }

  async deactivateWeightConfig(
    companyId: number,
    id: number
  ): Promise<EffectivenessWeightConfig> {
    return this.prisma.effectivenessWeightConfig.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async deactivateAllActiveConfigs(
    companyId: number,
    prismaTx?: Prisma.TransactionClient
  ): Promise<Prisma.BatchPayload> {
    const client = prismaTx || this.prisma;
    return client.effectivenessWeightConfig.updateMany({
      where: { companyId, isActive: true },
      data: { isActive: false },
    });
  }
}