import { Prisma, type PrismaClient } from "@prisma/client";
import logger from "../../config/logger.js";
import { getPrismaClient } from "../../config/database.js";
import { generateCertificateNumber } from "../certificates/certificate-number.js";
import { notificationDispatcher } from "../notifications/index.js";
import { evaluateXpConditionExpression } from "./xp-condition-expression.js";

const MAX_ATTEMPTS = 3;
const RETRY_MINUTES = 15;

const addUtcMonths = (date: Date, months: number | null) => {
  if (!months) return null;
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
};

const employeeMatchesAudience = (
  employee: {
    departmentId: number | null;
    jobTitleId: number | null;
    jobLevelId: number | null;
    employmentTypeId: number | null;
    startDate: Date | null;
    appUsers: { roleId: number | null; isActive: boolean }[];
  },
  rules: {
    operator: "AND" | "OR";
    isExclusion: boolean;
    departmentId: number | null;
    jobTitleId: number | null;
    jobLevelId: number | null;
    employmentTypeId: number | null;
    appRoleId: number | null;
    hireWithinDays: number | null;
  }[],
  now: Date,
) => {
  const matches = (rule: (typeof rules)[number]) => {
    if (rule.departmentId != null && employee.departmentId !== rule.departmentId) return false;
    if (rule.jobTitleId != null && employee.jobTitleId !== rule.jobTitleId) return false;
    if (rule.jobLevelId != null && employee.jobLevelId !== rule.jobLevelId) return false;
    if (rule.employmentTypeId != null && employee.employmentTypeId !== rule.employmentTypeId) return false;
    if (
      rule.appRoleId != null &&
      !employee.appUsers.some((user) => user.isActive && user.roleId === rule.appRoleId)
    ) return false;
    if (rule.hireWithinDays != null) {
      if (!employee.startDate) return false;
      const days = (now.getTime() - employee.startDate.getTime()) / 86_400_000;
      if (days > rule.hireWithinDays) return false;
    }
    return true;
  };
  const inclusions = rules.filter((rule) => !rule.isExclusion);
  if (inclusions.length === 0) return false;
  let included = matches(inclusions[0]!);
  for (const rule of inclusions.slice(1)) {
    included = rule.operator === "AND" ? included && matches(rule) : included || matches(rule);
  }
  return included && !rules.filter((rule) => rule.isExclusion).some(matches);
};

export class CompletionRewardsService {
  constructor(private readonly prisma: PrismaClient) {}

  async processIds(ids: number[]) {
    const results = [];
    for (const id of Array.from(new Set(ids))) {
      results.push(await this.processOne(id));
    }
    return results;
  }

  async processPending(limit = 20) {
    const now = new Date();
    const staleLock = new Date(now.getTime() - RETRY_MINUTES * 60_000);
    const rows = await this.prisma.completionOutbox.findMany({
      where: {
        OR: [
          { status: { in: ["PENDING", "FAILED"] }, availableAt: { lte: now } },
          { status: "PROCESSING", lockedAt: { lt: staleLock } },
        ],
      },
      select: { id: true },
      orderBy: [{ availableAt: "asc" }, { id: "asc" }],
      take: limit,
    });
    return this.processIds(rows.map((row) => row.id));
  }

  async processOne(id: number, now = new Date()) {
    let dispatches: Awaited<ReturnType<typeof notificationDispatcher.dispatch>>[] = [];
    try {
      const result = await this.serializable(async (tx) => {
        const outbox = await tx.completionOutbox.findUnique({ where: { id } });
        if (!outbox || outbox.status === "PROCESSED") {
          return { status: outbox?.status ?? "MISSING", dispatches: [] };
        }
        await tx.completionOutbox.update({
          where: { id },
          data: { status: "PROCESSING", lockedAt: now, attemptCount: { increment: 1 } },
        });

        const warnings: string[] = [];
        const localDispatches: Awaited<ReturnType<typeof notificationDispatcher.dispatch>>[] = [];
        if (outbox.eventType === "COURSE_COMPLETED" && outbox.courseCompletionId) {
          const completion = await tx.courseCompletion.findFirstOrThrow({
            where: { id: outbox.courseCompletionId, companyId: outbox.companyId, passed: true },
            include: {
              enrollment: {
                include: {
                  employee: {
                    include: {
                      appUsers: {
                        where: { isActive: true },
                        select: { id: true, roleId: true, isActive: true },
                      },
                    },
                  },
                  courseVersion: { include: { course: { select: { title: true } } } },
                },
              },
            },
          });
          const templates = await tx.certificateTemplate.findMany({
            where: {
              companyId: outbox.companyId,
              courseVersionId: completion.enrollment.courseVersionId,
              learningProgramId: null,
              status: "PUBLISHED",
              deletedAt: null,
            },
          });
          if (completion.enrollment.courseVersion.certificateRequired) {
            if (templates.length !== 1) {
              warnings.push(
                templates.length === 0
                  ? "No published course certificate template is configured."
                  : "Multiple published course certificate templates are configured.",
              );
            } else {
              const certificateResult = await this.issueCertificate(tx, {
                companyId: outbox.companyId,
                completionId: completion.id,
                programCompletionId: null,
                template: templates[0]!,
                completedAt: completion.completedAt,
              });
              if (certificateResult.created) {
                localDispatches.push(
                  await notificationDispatcher.dispatch(tx, {
                    companyId: outbox.companyId,
                    eventCode: "CERTIFICATE_ISSUED",
                    recipientUserIds: completion.enrollment.employee.appUsers.map((user) => user.id),
                    entityType: "CERTIFICATE",
                    entityId: String(certificateResult.certificate.id),
                    occurrenceKey: "issued",
                    actionUrl: `/?screen=my-certificates&certificateId=${certificateResult.certificate.id}`,
                    variables: {
                      certificateName: templates[0]!.name,
                      certificateNumber: certificateResult.certificate.certificateNumber,
                    },
                  }),
                );
              }
            }
          }
          await this.awardXp(tx, {
            companyId: outbox.companyId,
            employee: completion.enrollment.employee,
            triggerSlug: "course_completed",
            sourceType: "COURSE_COMPLETION",
            sourceId: completion.id,
            courseVersionId: completion.enrollment.courseVersionId,
            programId: null,
            now,
            warnings,
          });
        } else if (outbox.eventType === "PROGRAM_COMPLETED" && outbox.programCompletionId) {
          const completion = await tx.programCompletion.findFirstOrThrow({
            where: { id: outbox.programCompletionId, companyId: outbox.companyId },
            include: {
              programEnrollment: {
                include: {
                  employee: {
                    include: {
                      appUsers: {
                        where: { isActive: true },
                        select: { id: true, roleId: true, isActive: true },
                      },
                    },
                  },
                  program: { select: { id: true, name: true } },
                },
              },
            },
          });
          const templates = await tx.certificateTemplate.findMany({
            where: {
              companyId: outbox.companyId,
              learningProgramId: completion.programEnrollment.programId,
              courseVersionId: null,
              status: "PUBLISHED",
              deletedAt: null,
            },
          });
          if (templates.length > 1) {
            warnings.push("Multiple published program certificate templates are configured.");
          } else if (templates.length === 1) {
            const certificateResult = await this.issueCertificate(tx, {
              companyId: outbox.companyId,
              completionId: null,
              programCompletionId: completion.id,
              template: templates[0]!,
              completedAt: completion.completedAt,
            });
            if (certificateResult.created) {
              localDispatches.push(
                await notificationDispatcher.dispatch(tx, {
                  companyId: outbox.companyId,
                  eventCode: "CERTIFICATE_ISSUED",
                  recipientUserIds: completion.programEnrollment.employee.appUsers.map((user) => user.id),
                  entityType: "CERTIFICATE",
                  entityId: String(certificateResult.certificate.id),
                  occurrenceKey: "issued",
                  actionUrl: `/?screen=my-certificates&certificateId=${certificateResult.certificate.id}`,
                  variables: {
                    certificateName: templates[0]!.name,
                    certificateNumber: certificateResult.certificate.certificateNumber,
                  },
                }),
              );
            }
          }
          await this.awardXp(tx, {
            companyId: outbox.companyId,
            employee: completion.programEnrollment.employee,
            triggerSlug: "program_completed",
            sourceType: "PROGRAM_COMPLETION",
            sourceId: completion.id,
            courseVersionId: null,
            programId: completion.programEnrollment.programId,
            now,
            warnings,
          });
        } else {
          throw new Error(`Unsupported completion outbox event ${outbox.eventType}.`);
        }

        const retry = warnings.some((warning) => warning.includes("certificate template"));
        const availableAt = new Date(now.getTime() + RETRY_MINUTES * 60_000);
        await tx.completionOutbox.update({
          where: { id },
          data: {
            status: retry ? "FAILED" : "PROCESSED",
            availableAt: retry ? availableAt : now,
            lockedAt: null,
            processedAt: retry ? null : now,
            lastError: warnings.length > 0 ? warnings.join(" ") : null,
          },
        });
        return { status: retry ? "FAILED" : "PROCESSED", warnings, dispatches: localDispatches };
      });
      dispatches = result.dispatches;
      await Promise.all(dispatches.map((item) => notificationDispatcher.deliverAfterCommit(item)));
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.prisma.completionOutbox.updateMany({
        where: { id, status: { not: "PROCESSED" } },
        data: {
          status: "FAILED",
          lockedAt: null,
          availableAt: new Date(now.getTime() + RETRY_MINUTES * 60_000),
          lastError: message,
        },
      });
      logger.error("[CompletionRewards] Processing failed", { outboxId: id, error: message });
      return { status: "FAILED", warnings: [message], dispatches: [] };
    }
  }

  private async issueCertificate(
    tx: Prisma.TransactionClient,
    input: {
      companyId: number;
      completionId: number | null;
      programCompletionId: number | null;
      template: { id: number; validityMonths: number | null };
      completedAt: Date;
    },
  ) {
    const existing = await tx.certificate.findFirst({
      where: input.completionId
        ? { companyId: input.companyId, completionId: input.completionId }
        : { companyId: input.companyId, programCompletionId: input.programCompletionId },
    });
    if (existing) return { certificate: existing, created: false };
    const certificateNumber = generateCertificateNumber();
    const certificate = await tx.certificate.create({
      data: {
        companyId: input.companyId,
        issuanceType: input.completionId ? "COURSE_COMPLETION" : "PROGRAM_COMPLETION",
        completionId: input.completionId,
        programCompletionId: input.programCompletionId,
        templateId: input.template.id,
        certificateNumber,
        verificationCode: certificateNumber,
        issuedAt: input.completedAt,
        expiresAt: addUtcMonths(input.completedAt, input.template.validityMonths),
        status: "ACTIVE",
      },
    });
    return { certificate, created: true };
  }

  private async awardXp(
    tx: Prisma.TransactionClient,
    input: {
      companyId: number;
      employee: {
        id: string;
        departmentId: number | null;
        jobTitleId: number | null;
        jobLevelId: number | null;
        employmentTypeId: number | null;
        startDate: Date | null;
        appUsers: { roleId: number | null; isActive: boolean }[];
      };
      triggerSlug: string;
      sourceType: "COURSE_COMPLETION" | "PROGRAM_COMPLETION";
      sourceId: number;
      courseVersionId: number | null;
      programId: number | null;
      now: Date;
      warnings: string[];
    },
  ) {
    const rules = await tx.xpRule.findMany({
      where: {
        companyId: input.companyId,
        isActive: true,
        triggerEvent: { companyId: input.companyId, isActive: true, slug: input.triggerSlug },
        ...(input.courseVersionId
          ? { programId: null, OR: [{ courseVersionId: null }, { courseVersionId: input.courseVersionId }] }
          : { courseVersionId: null, OR: [{ programId: null }, { programId: input.programId }] }),
      },
      include: {
        targetAudience: {
          include: { audienceGroup: { include: { rules: true } } },
        },
      },
      orderBy: { id: "asc" },
    });

    for (const rule of rules) {
      if (rule.conditionExpression != null) {
        const condition = evaluateXpConditionExpression(rule.conditionExpression, {
          companyId: input.companyId,
          employee: input.employee,
          triggerSlug: input.triggerSlug,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          courseVersionId: input.courseVersionId,
          programId: input.programId,
        });
        if (!condition.matches) {
          if (condition.error) {
            input.warnings.push(
              `XP rule ${rule.id} skipped because conditionExpression is invalid: ${condition.error}`,
            );
          }
          continue;
        }
      }
      if (
        rule.targetAudience &&
        (!rule.targetAudience.audienceGroup.isActive ||
          !employeeMatchesAudience(
            input.employee,
            rule.targetAudience.audienceGroup.rules,
            input.now,
          ))
      ) continue;
      const existing = await tx.xpTransaction.findFirst({
        where: {
          companyId: input.companyId,
          employeeId: input.employee.id,
          ruleId: rule.id,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
        },
        select: { id: true },
      });
      if (existing) continue;
      if (rule.maximumAward != null) {
        const awardCount = await tx.xpTransaction.count({
          where: { companyId: input.companyId, employeeId: input.employee.id, ruleId: rule.id },
        });
        if (awardCount >= rule.maximumAward) continue;
      }
      const multiplier = Number(rule.multiplier ?? 1);
      await tx.xpTransaction.create({
        data: {
          companyId: input.companyId,
          employeeId: input.employee.id,
          ruleId: rule.id,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          xpAwarded: Math.round(rule.xpAmount * multiplier),
          multiplier,
          remarks: `Automatically awarded for ${input.triggerSlug}.`,
        },
      });
    }
  }

  private async serializable<T>(work: (tx: Prisma.TransactionClient) => Promise<T>) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        return await this.prisma.$transaction(work, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error) {
        const retryable =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
        if (!retryable || attempt === MAX_ATTEMPTS) throw error;
      }
    }
    throw new Error("Serializable completion reward retry limit exceeded.");
  }
}

export const completionRewardsService = new CompletionRewardsService(getPrismaClient());
