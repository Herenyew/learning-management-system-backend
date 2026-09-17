import { Prisma, type PrismaClient } from "@prisma/client";
import type { ProgramCohortRosterTransaction } from "./program-cohort-roster.types.js";

const MAX_SERIALIZABLE_ATTEMPTS = 3;

export const rosterEnrollmentSelect = {
  id: true,
  companyId: true,
  employeeId: true,
  programId: true,
  cohortId: true,
  enrollmentNo: true,
  source: true,
  enrollmentStatus: true,
  progressPercentage: true,
  enrolledAt: true,
  startDate: true,
  dueDate: true,
  completedAt: true,
  assignedBy: true,
  employee: {
    select: {
      id: true,
      fullName: true,
      isActive: true,
    },
  },
  enrollments: {
    where: { deletedAt: null },
    select: {
      id: true,
      courseVersionId: true,
      status: true,
      enrolledAt: true,
      startedAt: true,
      dueDate: true,
      completedAt: true,
      courseVersion: {
        select: {
          id: true,
          course: { select: { id: true, code: true, title: true } },
        },
      },
    },
    orderBy: { id: "asc" },
  },
} satisfies Prisma.ProgramEnrollmentSelect;

export const programWaitlistEntrySelect = {
  id: true,
  companyId: true,
  programId: true,
  cohortId: true,
  employeeId: true,
  programEnrollmentId: true,
  position: true,
  status: true,
  offeredAt: true,
  offerExpiresAt: true,
  acceptedAt: true,
  expiredAt: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
  employee: {
    select: { id: true, fullName: true, isActive: true },
  },
} satisfies Prisma.ProgramWaitlistEntrySelect;

export class ProgramCohortRosterRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async transaction<T>(
    work: (tx: ProgramCohortRosterTransaction) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 1; attempt <= MAX_SERIALIZABLE_ATTEMPTS; attempt += 1) {
      try {
        return await this.prisma.$transaction(work, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error) {
        const retryable =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
        if (!retryable || attempt === MAX_SERIALIZABLE_ATTEMPTS) throw error;
      }
    }
    throw new Error("Serializable roster transaction retry limit exceeded.");
  }

  findActiveUserEmployee(companyId: number, userId: number) {
    return this.prisma.appUser.findFirst({
      where: {
        id: userId,
        companyId,
        isActive: true,
        employee: { isActive: true, companyId },
      },
      select: { employeeId: true },
    });
  }

  findScope(companyId: number, programId: number, cohortId: number) {
    return this.prisma.programCohort.findFirst({
      where: {
        id: cohortId,
        companyId,
        programId,
        program: { companyId, deletedAt: null },
      },
      select: {
        id: true,
        companyId: true,
        programId: true,
        name: true,
        capacity: true,
        startDate: true,
        endDate: true,
        program: {
          select: {
            id: true,
            name: true,
            status: true,
            approvalStatus: true,
            visibility: true,
            rollingEnrollment: true,
            maxEnrollments: true,
            startDate: true,
            endDate: true,
            durationDays: true,
          },
        },
      },
    });
  }

  async listWaitlist(companyId: number, programId: number, cohortId: number) {
    const scope = await this.findScope(companyId, programId, cohortId);
    if (!scope) return null;
    const entries = await this.prisma.programWaitlistEntry.findMany({
      where: { companyId, programId, cohortId },
      select: programWaitlistEntrySelect,
      orderBy: [{ position: "asc" }, { id: "asc" }],
    });
    return {
      program: scope.program,
      cohort: {
        id: scope.id,
        name: scope.name,
        capacity: scope.capacity,
        startDate: scope.startDate,
        endDate: scope.endDate,
      },
      activeCount: entries.filter(
        (entry) => entry.status === "WAITING" || entry.status === "OFFERED",
      ).length,
      entries,
    };
  }

  async listRoster(companyId: number, programId: number, cohortId: number) {
    const scope = await this.findScope(companyId, programId, cohortId);
    if (!scope) return null;

    const enrollments = await this.prisma.programEnrollment.findMany({
      where: { companyId, programId, cohortId, deletedAt: null },
      select: rosterEnrollmentSelect,
      orderBy: [{ employee: { fullName: "asc" } }, { id: "asc" }],
    });

    return {
      program: scope.program,
      cohort: {
        id: scope.id,
        name: scope.name,
        capacity: scope.capacity,
        startDate: scope.startDate,
        endDate: scope.endDate,
      },
      enrollmentCount: enrollments.length,
      enrollments,
    };
  }
}
