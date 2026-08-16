import { PrismaClient, Prisma, EnrollmentRuleType, EnrollmentRule } from "@prisma/client";
import {
  CreateEnrollmentRuleTypeInputDto,
  UpdateEnrollmentRuleTypeInputDto,
  EnrollmentRuleTypeFilterQueryDto,
  CreateEnrollmentRuleInputDto,
  UpdateEnrollmentRuleInputDto,
  EnrollmentRuleFilterQueryDto,
} from "./enrollment-configuration.dto.js";

export interface IEnrollmentConfigurationRepository {
  // ==========================================
  // 1. EnrollmentRuleType Methods
  // ==========================================
  createEnrollmentRuleType(
    companyId: number,
    data: CreateEnrollmentRuleTypeInputDto
  ): Promise<EnrollmentRuleType>;

  findEnrollmentRuleTypeById(
    companyId: number,
    id: number
  ): Promise<EnrollmentRuleType | null>;

  findEnrollmentRuleTypeByName(
    companyId: number,
    name: string
  ): Promise<EnrollmentRuleType | null>;

  findEnrollmentRuleTypeBySlug(
    companyId: number,
    slug: string
  ): Promise<EnrollmentRuleType | null>;

  findEnrollmentRuleTypes(
    companyId: number,
    query: EnrollmentRuleTypeFilterQueryDto
  ): Promise<{
    data: EnrollmentRuleType[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>;

  updateEnrollmentRuleType(
    companyId: number,
    id: number,
    data: UpdateEnrollmentRuleTypeInputDto
  ): Promise<Prisma.BatchPayload>;

  softDeleteEnrollmentRuleType(
    companyId: number,
    id: number
  ): Promise<Prisma.BatchPayload>;

  countEnrollmentRuleTypeUsages(
    companyId: number,
    id: number
  ): Promise<number>;

  // ==========================================
  // 2. EnrollmentRule Methods
  // ==========================================
  createEnrollmentRule(
    companyId: number,
    userId: number,
    data: CreateEnrollmentRuleInputDto
  ): Promise<EnrollmentRule>;

  findEnrollmentRuleById(
    companyId: number,
    id: number
  ): Promise<EnrollmentRule | null>;

  findEnrollmentRuleByName(
    companyId: number,
    name: string
  ): Promise<EnrollmentRule | null>;

  findEnrollmentRules(
    companyId: number,
    query: EnrollmentRuleFilterQueryDto
  ): Promise<{
    data: EnrollmentRule[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>;

  updateEnrollmentRule(
    companyId: number,
    id: number,
    userId: number,
    data: UpdateEnrollmentRuleInputDto
  ): Promise<Prisma.BatchPayload>;

  softDeleteEnrollmentRule(
    companyId: number,
    id: number
  ): Promise<Prisma.BatchPayload>;

  countEnrollmentRuleUsages(
    companyId: number,
    id: number
  ): Promise<number>;

  // ==========================================
  // Foreign Key Existence Checks
  // ==========================================
  findCourseVersionById(
    companyId: number,
    id: number
  ): Promise<any | null>;

  findLearningProgramById(
    companyId: number,
    id: number
  ): Promise<any | null>;

  findTargetAudienceById(
    companyId: number,
    id: number
  ): Promise<any | null>;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export class EnrollmentConfigurationRepository implements IEnrollmentConfigurationRepository {
  constructor(private prisma: PrismaClient) {}

  // ==========================================
  // 1. EnrollmentRuleType Methods
  // ==========================================

  async createEnrollmentRuleType(
    companyId: number,
    data: CreateEnrollmentRuleTypeInputDto
  ) {
    const slug = data.slug ? slugify(data.slug) : slugify(data.name);

    return this.prisma.enrollmentRuleType.create({
      data: {
        companyId,
        name: data.name,
        slug,
        description: data.description,
        isActive: data.isActive,
      },
    });
  }

  async findEnrollmentRuleTypeById(companyId: number, id: number) {
    return this.prisma.enrollmentRuleType.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
    });
  }

  async findEnrollmentRuleTypeByName(companyId: number, name: string) {
    return this.prisma.enrollmentRuleType.findFirst({
      where: {
        companyId,
        name: { equals: name, mode: "insensitive" },
        deletedAt: null,
      },
    });
  }

  async findEnrollmentRuleTypeBySlug(companyId: number, slug: string) {
    return this.prisma.enrollmentRuleType.findFirst({
      where: {
        companyId,
        slug,
        deletedAt: null,
      },
    });
  }

  async findEnrollmentRuleTypes(
    companyId: number,
    query: EnrollmentRuleTypeFilterQueryDto
  ) {
    const { search, isSystem, isActive, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.EnrollmentRuleTypeWhereInput = {
      companyId,
      deletedAt: null,
      ...(isSystem !== undefined && { isSystem }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.enrollmentRuleType.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
      this.prisma.enrollmentRuleType.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateEnrollmentRuleType(
    companyId: number,
    id: number,
    data: UpdateEnrollmentRuleTypeInputDto
  ) {
    return this.prisma.enrollmentRuleType.updateMany({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.slug !== undefined && { slug: slugify(data.slug) }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async softDeleteEnrollmentRuleType(companyId: number, id: number) {
    return this.prisma.enrollmentRuleType.updateMany({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async countEnrollmentRuleTypeUsages(companyId: number, id: number) {
    return this.prisma.enrollmentRule.count({
      where: {
        companyId,
        ruleTypeId: id,
        deletedAt: null,
      },
    });
  }

  // ==========================================
  // 2. EnrollmentRule Methods
  // ==========================================

  async createEnrollmentRule(
    companyId: number,
    userId: number,
    data: CreateEnrollmentRuleInputDto
  ) {
    return this.prisma.enrollmentRule.create({
      data: {
        companyId,
        createdBy: userId,
        name: data.name,
        description: data.description,
        entityType: data.entityType,
        courseVersionId: data.courseVersionId ?? null,
        programId: data.programId ?? null,
        ruleTypeId: data.ruleTypeId,
        priority: data.priority,
        isActive: data.isActive,
        targetAudienceId: data.targetAudienceId ?? null,
        conditionExpression: data.conditionExpression
          ? (data.conditionExpression as Prisma.InputJsonValue)
          : Prisma.DbNull,
      },
    });
  }

  async findEnrollmentRuleById(companyId: number, id: number) {
    return this.prisma.enrollmentRule.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
      include: {
        ruleType: true,
        targetAudience: true,
      },
    });
  }

  async findEnrollmentRuleByName(companyId: number, name: string) {
    return this.prisma.enrollmentRule.findFirst({
      where: {
        companyId,
        name: { equals: name, mode: "insensitive" },
        deletedAt: null,
      },
    });
  }

  async findEnrollmentRules(
    companyId: number,
    query: EnrollmentRuleFilterQueryDto
  ) {
    const {
      search,
      ruleTypeId,
      entityType,
      courseVersionId,
      programId,
      targetAudienceId,
      isActive,
      page,
      limit,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.EnrollmentRuleWhereInput = {
      companyId,
      deletedAt: null,
      ...(ruleTypeId && { ruleTypeId }),
      ...(entityType && { entityType }),
      ...(courseVersionId && { courseVersionId }),
      ...(programId && { programId }),
      ...(targetAudienceId && { targetAudienceId }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.enrollmentRule.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        include: {
          ruleType: true,
          targetAudience: true,
        },
      }),
      this.prisma.enrollmentRule.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateEnrollmentRule(
    companyId: number,
    id: number,
    userId: number,
    data: UpdateEnrollmentRuleInputDto
  ) {
    return this.prisma.enrollmentRule.updateMany({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
      data: {
        updatedBy: userId,
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.entityType !== undefined && { entityType: data.entityType }),
        ...(data.courseVersionId !== undefined && { courseVersionId: data.courseVersionId }),
        ...(data.programId !== undefined && { programId: data.programId }),
        ...(data.ruleTypeId !== undefined && { ruleTypeId: data.ruleTypeId }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.targetAudienceId !== undefined && { targetAudienceId: data.targetAudienceId }),
        ...(data.conditionExpression !== undefined && {
          conditionExpression: data.conditionExpression
            ? (data.conditionExpression as Prisma.InputJsonValue)
            : Prisma.DbNull,
        }),
      },
    });
  }

  async softDeleteEnrollmentRule(companyId: number, id: number) {
    return this.prisma.enrollmentRule.updateMany({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async countEnrollmentRuleUsages(companyId: number, id: number) {
    const rule = await this.prisma.enrollmentRule.findUnique({ where: { id } });
    if (!rule) return 0;

    const [enrollments, programEnrollments] = await Promise.all([
      rule.courseVersionId
        ? this.prisma.enrollment.count({
            where: { companyId, courseVersionId: rule.courseVersionId, deletedAt: null },
          })
        : Promise.resolve(0),
      rule.programId
        ? this.prisma.programEnrollment.count({
            where: { companyId, programId: rule.programId, deletedAt: null },
          })
        : Promise.resolve(0),
    ]);

    return enrollments + programEnrollments;
  }

  // ==========================================
  // Foreign Key Existence Checks
  // ==========================================

  async findCourseVersionById(companyId: number, id: number) {
    return this.prisma.courseVersion.findFirst({
      where: {
        id,
        course: { companyId },
        deletedAt: null,
      },
    });
  }

  async findLearningProgramById(companyId: number, id: number) {
    return this.prisma.learningProgram.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
    });
  }

  async findTargetAudienceById(companyId: number, id: number) {
    return this.prisma.targetAudience.findFirst({
      where: {
        id,
        companyId,
        
      },
    });
  }
}