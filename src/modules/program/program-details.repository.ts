import { Prisma, type PrismaClient } from "@prisma/client";
import { ConflictError, NotFoundError } from "../../common/errors/http-errors.js";
import type {
  CreateProgramInput,
  ProgramListQuery,
  UpdateProgramInput,
} from "./program-details.types.js";

const ownerSelect = (companyId: number) => ({
  id: true,
  fullName: true,
  isActive: true,
  appUsers: {
    where: { companyId, isActive: true },
    select: {
      email: true,
      role: { select: { name: true, isActive: true } },
      primaryEmRole: { select: { name: true, isActive: true } },
      roleAssignments: {
        where: {
          companyId,
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        select: {
          appRole: { select: { name: true, isActive: true } },
        },
      },
    },
  },
}) satisfies Prisma.EmployeeSelect;

const snapshotJson = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

const jsonInput = (
  value: Prisma.JsonValue | null,
): Prisma.InputJsonValue | typeof Prisma.DbNull =>
  value === null ? Prisma.DbNull : value as Prisma.InputJsonValue;

const mutationSelect = {
  id: true,
  name: true,
  description: true,
  programTypeId: true,
  programCategoryId: true,
  ownerEmployeeId: true,
  visibility: true,
  status: true,
  startDate: true,
  endDate: true,
  durationDays: true,
  rollingEnrollment: true,
  maxEnrollments: true,
  approvalStatus: true,
} as const;

const displaySelect = {
  id: true,
  companyId: true,
  name: true,
  description: true,
  programTypeId: true,
  programCategoryId: true,
  ownerEmployeeId: true,
  visibility: true,
  status: true,
  startDate: true,
  endDate: true,
  durationDays: true,
  rollingEnrollment: true,
  maxEnrollments: true,
  approvalStatus: true,
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
  programType: { select: { id: true, name: true } },
  programCategory: { select: { id: true, name: true, color: true } },
  owner: { select: { id: true, fullName: true } },
} as const;

export class ProgramDetailsRepository {
  constructor(private readonly prisma: PrismaClient) { }

  findByName(companyId: number, name: string, excludeId?: number) {
    return this.prisma.learningProgram.findFirst({
      where: {
        companyId,
        deletedAt: null,
        name: { equals: name, mode: "insensitive" },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
  }

  findProgramType(companyId: number, id: number) {
    return this.prisma.programType.findFirst({
      where: { id, companyId, deletedAt: null },
      select: { id: true, isActive: true },
    });
  }

  findProgramCategory(companyId: number, id: number) {
    return this.prisma.programCategory.findFirst({
      where: { id, companyId, deletedAt: null },
      select: { id: true, isActive: true },
    });
  }

  findOwner(companyId: number, employeeId: string) {
    return this.prisma.employee.findFirst({
      where: { id: employeeId, companyId },
      select: ownerSelect(companyId),
    });
  }

  listOwners(companyId: number) {
    return this.prisma.employee.findMany({
      where: { companyId, isActive: true },
      select: ownerSelect(companyId),
      orderBy: { fullName: "asc" },
    });
  }

  create(
    companyId: number,
    userId: number,
    data: CreateProgramInput,
    durationDays: number | null,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const duplicate = await tx.learningProgram.findFirst({
        where: {
          companyId,
          deletedAt: null,
          name: { equals: data.name, mode: "insensitive" },
        },
        select: { id: true },
      });
      if (duplicate) {
        throw new ConflictError(`A program named '${data.name}' already exists in this company.`);
      }

      const program = await tx.learningProgram.create({
        data: {
          companyId,
          createdBy: userId,
          name: data.name,
          description: data.description ?? null,
          programTypeId: data.programTypeId,
          programCategoryId: data.programCategoryId ?? null,
          ownerEmployeeId: data.ownerEmployeeId,
          visibility: data.visibility,
          status: "DRAFT",
          approvalStatus: "PENDING",
          startDate: data.startDate ?? null,
          endDate: data.endDate ?? null,
          durationDays,
          rollingEnrollment: data.rollingEnrollment,
          maxEnrollments: data.maxEnrollments ?? null,
        },
        select: displaySelect,
      });
      await tx.auditLog.create({
        data: {
          companyId,
          actorUserId: userId,
          entityType: "LEARNING_PROGRAM",
          entityId: String(program.id),
          action: "CREATED",
          afterJson: snapshotJson(program),
        },
      });
      return program;
    });
  }

  async list(companyId: number, query: ProgramListQuery) {
    const where = {
      companyId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" as const } },
            { description: { contains: query.search, mode: "insensitive" as const } },
          ],
        }
        : {}),
    };
    const skip = (query.page - 1) * query.pageSize;

    const [items, total] = await Promise.all([
      this.prisma.learningProgram.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
        select: displaySelect,
      }),
      this.prisma.learningProgram.count({ where }),
    ]);

    return { items, total };
  }

  findById(companyId: number, id: number) {
    return this.prisma.learningProgram.findFirst({
      where: { id, companyId, deletedAt: null },
      select: {
        ...displaySelect,
        _count: {
          select: {
            courses: true,
            cohorts: true,
            enrollments: { where: { deletedAt: null } },
            milestones: true,
            tasks: true,
            liveSessions: true,
            approvalInstances: true,
            programTagMappings: true,
          },
        },
      },
    });
  }

  findMutationState(companyId: number, id: number) {
    return this.prisma.learningProgram.findFirst({
      where: { id, companyId, deletedAt: null },
      select: mutationSelect,
    });
  }

  async hasPendingApproval(companyId: number, id: number) {
    const instance = await this.prisma.approvalWorkflowInstance.findFirst({
      where: {
        companyId,
        learningProgramId: id,
        entityType: "LEARNING_PROGRAM",
        status: "PENDING",
      },
      select: { id: true },
    });
    return Boolean(instance);
  }

  countActiveEnrollments(companyId: number, id: number) {
    return this.prisma.programEnrollment.count({
      where: {
        companyId,
        programId: id,
        enrollmentStatus: "ACTIVE",
        deletedAt: null,
      },
    });
  }

  update(
    companyId: number,
    userId: number,
    id: number,
    data: UpdateProgramInput,
    durationDays: number | null,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.learningProgram.findFirst({
        where: { id, companyId, deletedAt: null, status: "DRAFT" },
        select: mutationSelect,
      });
      if (!before) {
        throw new ConflictError("Only draft learning programs can be updated.");
      }
      const [pendingApproval, duplicate] = await Promise.all([
        tx.approvalWorkflowInstance.findFirst({
          where: {
            companyId,
            learningProgramId: id,
            entityType: "LEARNING_PROGRAM",
            status: "PENDING",
          },
          select: { id: true },
        }),
        data.name
          ? tx.learningProgram.findFirst({
            where: {
              companyId,
              deletedAt: null,
              id: { not: id },
              name: { equals: data.name, mode: "insensitive" },
            },
            select: { id: true },
          })
          : Promise.resolve(null),
      ]);
      if (pendingApproval) {
        throw new ConflictError("A learning program with a pending approval instance cannot be updated.");
      }
      if (duplicate) {
        throw new ConflictError(`A program named '${data.name}' already exists in this company.`);
      }

      const program = await tx.learningProgram.update({
        where: { id, companyId, deletedAt: null },
        data: {
          ...data,
          durationDays,
          updatedBy: userId,
        },
        select: displaySelect,
      });
      await tx.auditLog.create({
        data: {
          companyId,
          actorUserId: userId,
          entityType: "LEARNING_PROGRAM",
          entityId: String(id),
          action: "UPDATED",
          beforeJson: snapshotJson(before),
          afterJson: snapshotJson(program),
        },
      });
      return program;
    });
  }

  archive(companyId: number, userId: number, id: number) {
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.learningProgram.findFirst({
        where: { id, companyId, deletedAt: null },
        select: mutationSelect,
      });
      if (!before || before.status === "ARCHIVED") {
        throw new ConflictError("Learning program is already archived.");
      }
      const [pendingApproval, activeEnrollments] = await Promise.all([
        tx.approvalWorkflowInstance.findFirst({
          where: {
            companyId,
            learningProgramId: id,
            entityType: "LEARNING_PROGRAM",
            status: "PENDING",
          },
          select: { id: true },
        }),
        tx.programEnrollment.count({
          where: {
            companyId,
            programId: id,
            enrollmentStatus: "ACTIVE",
            deletedAt: null,
          },
        }),
      ]);
      if (pendingApproval) {
        throw new ConflictError("A learning program with a pending approval instance cannot be archived.");
      }
      if (activeEnrollments) {
        throw new ConflictError("A learning program with active enrollments cannot be archived.");
      }

      const program = await tx.learningProgram.update({
        where: { id, companyId, deletedAt: null },
        data: { status: "ARCHIVED", updatedBy: userId },
        select: displaySelect,
      });
      await tx.auditLog.create({
        data: {
          companyId,
          actorUserId: userId,
          entityType: "LEARNING_PROGRAM",
          entityId: String(before.id),
          action: "ARCHIVED",
          beforeJson: snapshotJson(before),
          afterJson: snapshotJson(program),
        },
      });
      return program;
    });
  }

  restore(companyId: number, userId: number, id: number) {
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.learningProgram.findFirst({
        where: { id, companyId, deletedAt: null, status: "ARCHIVED" },
        select: mutationSelect,
      });
      if (!before) {
        throw new ConflictError("Only archived learning programs can be restored.");
      }

      const program = await tx.learningProgram.update({
        where: { id, companyId, deletedAt: null },
        data: { status: "DRAFT", updatedBy: userId },
        select: displaySelect,
      });
      await tx.auditLog.create({
        data: {
          companyId,
          actorUserId: userId,
          entityType: "LEARNING_PROGRAM",
          entityId: String(id),
          action: "RESTORED",
          beforeJson: snapshotJson(before),
          afterJson: snapshotJson(program),
        },
      });
      return program;
    });
  }

  duplicate(companyId: number, userId: number, sourceId: number, name: string) {
    return this.prisma.$transaction(async (tx) => {
      const source = await tx.learningProgram.findFirst({
        where: { id: sourceId, companyId, deletedAt: null },
        select: {
          ...mutationSelect,
          courses: {
            select: { courseVersionId: true, displayOrder: true, isRequired: true },
          },
          cohorts: {
            select: { name: true, capacity: true, startDate: true, endDate: true },
          },
          milestones: {
            select: {
              title: true,
              milestonePercentage: true,
              targetDate: true,
              targetOffsetDays: true,
              completionExpression: true,
              overdueAction: true,
              reminderOffsetsDays: true,
            },
          },
          tasks: {
            where: { deletedAt: null },
            select: {
              title: true,
              description: true,
              taskTypeId: true,
              courseVersionId: true,
              courseContentId: true,
              assessmentId: true,
              surveyId: true,
              maxSubmissions: true,
              allowResubmission: true,
              isRequired: true,
              isBlocking: true,
              displayOrder: true,
              phaseNumber: true,
              dueDate: true,
              dueOffsetDays: true,
              minimumTimeMinutes: true,
              minimumScore: true,
              minimumAttendance: true,
              requiresManagerApproval: true,
              peerReviewRequired: true,
              requiredPeerReviewCount: true,
              xpAward: true,
            },
          },
          programTagMappings: { select: { tagId: true } },
          enrollmentRules: {
            where: { deletedAt: null },
            select: {
              name: true,
              description: true,
              entityType: true,
              courseVersionId: true,
              ruleTypeId: true,
              priority: true,
              isActive: true,
              targetAudienceId: true,
              conditionExpression: true,
            },
          },
          xpRules: {
            select: {
              name: true,
              categoryId: true,
              triggerEventId: true,
              xpAmount: true,
              maximumAward: true,
              multiplier: true,
              targetAudienceId: true,
              conditionExpression: true,
              courseVersionId: true,
              isActive: true,
            },
          },
        },
      });
      if (!source) {
        throw new NotFoundError("Learning program");
      }
      const existingName = await tx.learningProgram.findFirst({
        where: {
          companyId,
          deletedAt: null,
          name: { equals: name, mode: "insensitive" },
        },
        select: { id: true },
      });
      if (existingName) {
        throw new ConflictError(`A program named '${name}' already exists in this company.`);
      }

      const duplicate = await tx.learningProgram.create({
        data: {
          companyId,
          name,
          description: source.description,
          programTypeId: source.programTypeId,
          programCategoryId: source.programCategoryId,
          ownerEmployeeId: source.ownerEmployeeId,
          visibility: source.visibility,
          status: "DRAFT",
          startDate: source.startDate,
          endDate: source.endDate,
          durationDays: source.durationDays,
          rollingEnrollment: source.rollingEnrollment,
          maxEnrollments: source.maxEnrollments,
          approvalStatus: "PENDING",
          createdBy: userId,
        },
        select: displaySelect,
      });

      if (source.courses.length) {
        await tx.programCourse.createMany({
          data: source.courses.map((course) => ({
            companyId,
            programId: duplicate.id,
            ...course,
          })),
        });
      }
      if (source.cohorts.length) {
        await tx.programCohort.createMany({
          data: source.cohorts.map((cohort) => ({
            companyId,
            programId: duplicate.id,
            ...cohort,
          })),
        });
      }
      if (source.milestones.length) {
        await tx.programMilestone.createMany({
          data: source.milestones.map((milestone) => ({
            companyId,
            programId: duplicate.id,
            ...milestone,
            completionExpression: jsonInput(milestone.completionExpression),
          })),
        });
      }
      if (source.tasks.length) {
        await tx.programTask.createMany({
          data: source.tasks.map((task) => ({
            companyId,
            programId: duplicate.id,
            ...task,
            liveSessionId: null,
          })),
        });
      }
      if (source.programTagMappings.length) {
        await tx.programTagMapping.createMany({
          data: source.programTagMappings.map((mapping) => ({
            companyId,
            programId: duplicate.id,
            tagId: mapping.tagId,
          })),
        });
      }

      const targetAudiences = await tx.targetAudience.findMany({
        where: { companyId, entityType: "LEARNING_PROGRAM", entityId: sourceId },
        select: {
          id: true,
          audienceGroupId: true,
          departmentId: true,
          appRoleId: true,
        },
      });
      const targetAudienceIds = new Map<number, number>();
      for (const target of targetAudiences) {
        const copiedTarget = await tx.targetAudience.create({
          data: {
            companyId,
            entityType: "LEARNING_PROGRAM",
            entityId: duplicate.id,
            audienceGroupId: target.audienceGroupId,
            departmentId: target.departmentId,
            appRoleId: target.appRoleId,
          },
          select: { id: true },
        });
        targetAudienceIds.set(target.id, copiedTarget.id);
      }

      for (const [index, rule] of source.enrollmentRules.entries()) {
        let attempt = 1;
        let ruleName = "";
        while (!ruleName) {
          const suffix = ` (Program ${duplicate.id}-${index + 1}${attempt > 1 ? `-${attempt}` : ""})`;
          const candidate = `${rule.name.slice(0, 255 - suffix.length)}${suffix}`;
          const existingRule = await tx.enrollmentRule.findFirst({
            where: {
              companyId,
              name: { equals: candidate, mode: "insensitive" },
            },
            select: { id: true },
          });
          if (!existingRule) {
            ruleName = candidate;
          }
          attempt += 1;
        }
        await tx.enrollmentRule.create({
          data: {
            companyId,
            name: ruleName,
            description: rule.description,
            entityType: "PROGRAM",
            courseVersionId: null,
            programId: duplicate.id,
            ruleTypeId: rule.ruleTypeId,
            priority: rule.priority,
            isActive: rule.isActive,
            targetAudienceId: rule.targetAudienceId
              ? targetAudienceIds.get(rule.targetAudienceId) ?? rule.targetAudienceId
              : null,
            conditionExpression: jsonInput(rule.conditionExpression),
            createdBy: userId,
          },
        });
      }

      if (source.xpRules.length) {
        await tx.xpRule.createMany({
          data: source.xpRules.map((rule) => ({
            companyId,
            name: rule.name,
            categoryId: rule.categoryId,
            triggerEventId: rule.triggerEventId,
            xpAmount: rule.xpAmount,
            maximumAward: rule.maximumAward,
            multiplier: rule.multiplier,
            targetAudienceId: rule.targetAudienceId
              ? targetAudienceIds.get(rule.targetAudienceId) ?? rule.targetAudienceId
              : null,
            conditionExpression: jsonInput(rule.conditionExpression),
            courseVersionId: rule.courseVersionId,
            programId: duplicate.id,
            isActive: rule.isActive,
            createdBy: userId,
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          companyId,
          actorUserId: userId,
          entityType: "LEARNING_PROGRAM",
          entityId: String(duplicate.id),
          action: "DUPLICATED",
          beforeJson: snapshotJson(source),
          afterJson: snapshotJson({ ...duplicate, sourceProgramId: sourceId }),
        },
      });
      return duplicate;
    });
  }

  async auditHistory(companyId: number, id: number) {
    const [auditLogs, approvalInstances] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: {
          companyId,
          entityType: "LEARNING_PROGRAM",
          entityId: String(id),
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          action: true,
          beforeJson: true,
          afterJson: true,
          createdAt: true,
          actorUser: {
            select: {
              id: true,
              email: true,
              employee: { select: { fullName: true } },
            },
          },
        },
      }),
      this.prisma.approvalWorkflowInstance.findMany({
        where: {
          companyId,
          learningProgramId: id,
          entityType: "LEARNING_PROGRAM",
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          submittedAt: true,
          completedAt: true,
          latestComment: true,
          createdAt: true,
          updatedAt: true,
          workflow: { select: { id: true, name: true } },
          submittedByUser: { select: { id: true, email: true } },
          decisions: {
            orderBy: { decidedAt: "desc" },
            select: {
              id: true,
              status: true,
              comment: true,
              decidedAt: true,
              decidedByUser: { select: { id: true, email: true } },
              workflowStep: { select: { id: true, approvalOrder: true } },
            },
          },
        },
      }),
    ]);
    return { auditLogs, approvalInstances };
  }
}
