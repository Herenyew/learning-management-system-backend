import { PrismaClient, Prisma, TnaRequestTypeConfig, FundingType, TrainingFormat } from "@prisma/client";
import {
  CreateTnaRequestTypeDto,
  UpdateTnaRequestTypeDto,
  TnaRequestTypeFilterDto,
  CreateFundingTypeDto,
  UpdateFundingTypeDto,
  FundingTypeFilterDto,
  CreateTrainingFormatDto,
  UpdateTrainingFormatDto,
  TrainingFormatFilterDto,
} from "./tna-configuration.dto.js";

export interface ITnaConfigurationRepository {
  // TnaRequestTypeConfig
  createRequestType(companyId: number, dto: CreateTnaRequestTypeDto): Promise<TnaRequestTypeConfig>;
  findRequestTypeById(companyId: number, id: number): Promise<TnaRequestTypeConfig | null>;
  findRequestTypeByName(companyId: number, name: string): Promise<TnaRequestTypeConfig | null>;
  findRequestTypes(companyId: number, filter: TnaRequestTypeFilterDto): Promise<TnaRequestTypeConfig[]>;
  countRequestTypes(companyId: number, filter: TnaRequestTypeFilterDto): Promise<number>;
  updateRequestType(companyId: number, id: number, dto: UpdateTnaRequestTypeDto): Promise<TnaRequestTypeConfig>;
  softDeleteRequestType(companyId: number, id: number): Promise<TnaRequestTypeConfig>;
  countRequestTypeUsages(companyId: number, id: number): Promise<number>;

  // FundingType
  createFundingType(companyId: number, dto: CreateFundingTypeDto & { slug: string }): Promise<FundingType>;
  findFundingTypeById(companyId: number, id: number): Promise<FundingType | null>;
  findFundingTypeByName(companyId: number, name: string): Promise<FundingType | null>;
  findFundingTypeBySlug(companyId: number, slug: string): Promise<FundingType | null>;
  findFundingTypes(companyId: number, filter: FundingTypeFilterDto): Promise<FundingType[]>;
  countFundingTypes(companyId: number, filter: FundingTypeFilterDto): Promise<number>;
  updateFundingType(companyId: number, id: number, dto: UpdateFundingTypeDto & { slug?: string }): Promise<FundingType>;
  softDeleteFundingType(companyId: number, id: number): Promise<FundingType>;
  countFundingTypeUsages(companyId: number, id: number): Promise<number>;

  // TrainingFormat
  createTrainingFormat(companyId: number, dto: CreateTrainingFormatDto & { slug: string }): Promise<TrainingFormat>;
  findTrainingFormatById(companyId: number, id: number): Promise<TrainingFormat | null>;
  findTrainingFormatByName(companyId: number, name: string): Promise<TrainingFormat | null>;
  findTrainingFormatBySlug(companyId: number, slug: string): Promise<TrainingFormat | null>;
  findTrainingFormats(companyId: number, filter: TrainingFormatFilterDto): Promise<TrainingFormat[]>;
  countTrainingFormats(companyId: number, filter: TrainingFormatFilterDto): Promise<number>;
  updateTrainingFormat(companyId: number, id: number, dto: UpdateTrainingFormatDto & { slug?: string }): Promise<TrainingFormat>;
  softDeleteTrainingFormat(companyId: number, id: number): Promise<TrainingFormat>;
  countTrainingFormatUsages(companyId: number, id: number): Promise<number>;
}

export class TnaConfigurationRepository implements ITnaConfigurationRepository {
  constructor(private prisma: PrismaClient) {}

  // ==========================================
  // 1. TnaRequestTypeConfig Methods
  // ==========================================

  async createRequestType(companyId: number, dto: CreateTnaRequestTypeDto): Promise<TnaRequestTypeConfig> {
    return this.prisma.tnaRequestTypeConfig.create({
      data: {
        companyId,
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findRequestTypeById(companyId: number, id: number): Promise<TnaRequestTypeConfig | null> {
    return this.prisma.tnaRequestTypeConfig.findFirst({
      where: { id, companyId },
    });
  }

  async findRequestTypeByName(companyId: number, name: string): Promise<TnaRequestTypeConfig | null> {
    return this.prisma.tnaRequestTypeConfig.findFirst({
      where: {
        companyId,
        name: { equals: name, mode: "insensitive" },
      },
    });
  }

  async findRequestTypes(companyId: number, filter: TnaRequestTypeFilterDto): Promise<TnaRequestTypeConfig[]> {
    const { search, isActive, page = 1, limit = 10 } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.TnaRequestTypeConfigWhereInput = {
      companyId,
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    return this.prisma.tnaRequestTypeConfig.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }

  async countRequestTypes(companyId: number, filter: TnaRequestTypeFilterDto): Promise<number> {
    const { search, isActive } = filter;

    const where: Prisma.TnaRequestTypeConfigWhereInput = {
      companyId,
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    return this.prisma.tnaRequestTypeConfig.count({ where });
  }

  async updateRequestType(
    companyId: number,
    id: number,
    dto: UpdateTnaRequestTypeDto
  ): Promise<TnaRequestTypeConfig> {
    return this.prisma.tnaRequestTypeConfig.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async softDeleteRequestType(companyId: number, id: number): Promise<TnaRequestTypeConfig> {
    return this.prisma.tnaRequestTypeConfig.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async countRequestTypeUsages(companyId: number, id: number): Promise<number> {
    return this.prisma.trainingNeedRequest.count({
      where: { companyId, requestTypeId: id },
    });
  }

  // ==========================================
  // 2. FundingType Methods
  // ==========================================

  async createFundingType(
    companyId: number,
    dto: CreateFundingTypeDto & { slug: string }
  ): Promise<FundingType> {
    return this.prisma.fundingType.create({
      data: {
        companyId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findFundingTypeById(companyId: number, id: number): Promise<FundingType | null> {
    return this.prisma.fundingType.findFirst({
      where: { id, companyId },
    });
  }

  async findFundingTypeByName(companyId: number, name: string): Promise<FundingType | null> {
    return this.prisma.fundingType.findFirst({
      where: {
        companyId,
        name: { equals: name, mode: "insensitive" },
      },
    });
  }

  async findFundingTypeBySlug(companyId: number, slug: string): Promise<FundingType | null> {
    return this.prisma.fundingType.findFirst({
      where: { companyId, slug },
    });
  }

  async findFundingTypes(companyId: number, filter: FundingTypeFilterDto): Promise<FundingType[]> {
    const { search, isActive, isSystem, page = 1, limit = 10 } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.FundingTypeWhereInput = {
      companyId,
      ...(isActive !== undefined && { isActive }),
      ...(isSystem !== undefined && { isSystem }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { slug: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    return this.prisma.fundingType.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }

  async countFundingTypes(companyId: number, filter: FundingTypeFilterDto): Promise<number> {
    const { search, isActive, isSystem } = filter;

    const where: Prisma.FundingTypeWhereInput = {
      companyId,
      ...(isActive !== undefined && { isActive }),
      ...(isSystem !== undefined && { isSystem }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { slug: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    return this.prisma.fundingType.count({ where });
  }

  async updateFundingType(
    companyId: number,
    id: number,
    dto: UpdateFundingTypeDto & { slug?: string }
  ): Promise<FundingType> {
    return this.prisma.fundingType.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.slug && { slug: dto.slug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async softDeleteFundingType(companyId: number, id: number): Promise<FundingType> {
    return this.prisma.fundingType.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async countFundingTypeUsages(companyId: number, id: number): Promise<number> {
    return this.prisma.trainingNeedRequest.count({
      where: { companyId, fundingTypeId: id },
    });
  }

  // ==========================================
  // 3. TrainingFormat Methods
  // ==========================================

  async createTrainingFormat(
    companyId: number,
    dto: CreateTrainingFormatDto & { slug: string }
  ): Promise<TrainingFormat> {
    return this.prisma.trainingFormat.create({
      data: {
        companyId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findTrainingFormatById(companyId: number, id: number): Promise<TrainingFormat | null> {
    return this.prisma.trainingFormat.findFirst({
      where: { id, companyId },
    });
  }

  async findTrainingFormatByName(companyId: number, name: string): Promise<TrainingFormat | null> {
    return this.prisma.trainingFormat.findFirst({
      where: {
        companyId,
        name: { equals: name, mode: "insensitive" },
      },
    });
  }

  async findTrainingFormatBySlug(companyId: number, slug: string): Promise<TrainingFormat | null> {
    return this.prisma.trainingFormat.findFirst({
      where: { companyId, slug },
    });
  }

  async findTrainingFormats(
    companyId: number,
    filter: TrainingFormatFilterDto
  ): Promise<TrainingFormat[]> {
    const { search, isActive, isSystem, page = 1, limit = 10 } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.TrainingFormatWhereInput = {
      companyId,
      ...(isActive !== undefined && { isActive }),
      ...(isSystem !== undefined && { isSystem }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { slug: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    return this.prisma.trainingFormat.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }

  async countTrainingFormats(
    companyId: number,
    filter: TrainingFormatFilterDto
  ): Promise<number> {
    const { search, isActive, isSystem } = filter;

    const where: Prisma.TrainingFormatWhereInput = {
      companyId,
      ...(isActive !== undefined && { isActive }),
      ...(isSystem !== undefined && { isSystem }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { slug: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    return this.prisma.trainingFormat.count({ where });
  }

  async updateTrainingFormat(
    companyId: number,
    id: number,
    dto: UpdateTrainingFormatDto & { slug?: string }
  ): Promise<TrainingFormat> {
    return this.prisma.trainingFormat.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.slug && { slug: dto.slug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async softDeleteTrainingFormat(companyId: number, id: number): Promise<TrainingFormat> {
    return this.prisma.trainingFormat.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async countTrainingFormatUsages(companyId: number, id: number): Promise<number> {
    return this.prisma.trainingNeedRequest.count({
      where: { companyId, preferredFormatId: id },
    });
  }
}