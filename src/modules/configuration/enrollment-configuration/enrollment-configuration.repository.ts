import { Prisma } from "@prisma/client";
import type { PrismaClient, EnrollmentRuleType, EnrollmentRule } from "@prisma/client";
import type {
  CreateEnrollmentRuleTypeInput,
  UpdateEnrollmentRuleTypeInput,
  EnrollmentRuleTypeFilterParams,
  CreateEnrollmentRuleInput,
  UpdateEnrollmentRuleInput,
  EnrollmentRuleFilterParams,
} from "./enrollment-configuration.types.js";

import type { IEnrollmentConfigurationRepository } from "./enrollment-configuration.types.js";

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
    data: CreateEnrollmentRuleTypeInput
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
    query: EnrollmentRuleTypeFilterParams
  ) {
    const { search, isSystem, isActive, page = 1, limit = 20 } = query;
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
    data: UpdateEnrollmentRuleTypeInput
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
    data: CreateEnrollmentRuleInput
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
    query: EnrollmentRuleFilterParams
  ) {
    const {
      search,
      ruleTypeId,
      entityType,
      courseVersionId,
      programId,
      targetAudienceId,
      isActive,
      page = 1,
      limit = 20,
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
    data: UpdateEnrollmentRuleInput
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

  async findCourseVersionOptions(
    companyId: number,
    query: { search?: string; limit?: number }
  ) {
    const limit = query.limit ?? 50;
    const versions = await this.prisma.courseVersion.findMany({
      where: {
        companyId,
        deletedAt: null,
        ...(query.search?.trim()
          ? { course: { title: { contains: query.search.trim(), mode: "insensitive" } } }
          : {}),
      },
      include: { course: { select: { title: true } } },
      orderBy: [{ courseId: "asc" }, { majorVersion: "desc" }, { minorVersion: "desc" }],
      take: limit,
    });

    return versions.map((v) => ({
      id: v.id,
      label: `${v.course.title} v${v.majorVersion}.${v.minorVersion}${v.versionLabel ? ` ${v.versionLabel}` : ""}`,
    }));
  }

  async findLearningProgramOptions(
    companyId: number,
    query: { search?: string; limit?: number }
  ) {
    const limit = query.limit ?? 50;
    const programs = await this.prisma.learningProgram.findMany({
      where: {
        companyId,
        deletedAt: null,
        ...(query.search?.trim()
          ? { name: { contains: query.search.trim(), mode: "insensitive" } }
          : {}),
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: limit,
    });

    return programs.map((p) => ({ id: p.id, label: p.name }));
  }
}
