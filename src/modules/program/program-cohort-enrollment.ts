import { Prisma, type EnrollmentSource, type ProgramEnrollmentSource } from "@prisma/client";
import { ConflictError, NotFoundError } from "../../common/errors/http-errors.js";
import { rosterEnrollmentSelect } from "./program-cohort-roster.repository.js";
import type {
  ProgramCohortRosterContext,
  ProgramCohortRosterTransaction,
} from "./program-cohort-roster.types.js";

const LIVE_ENROLLMENT_STATUSES = ["PENDING", "WAITLISTED", "ACTIVE"] as const;

export type ProgramCohortScope = {
  id: number;
  name: string;
  capacity: number | null;
  startDate: Date | null;
  endDate: Date | null;
  program: {
    id: number;
    name: string;
    status: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
    approvalStatus: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
    visibility: "PUBLIC" | "COMPANY" | "ENROLLED_ONLY" | "INVITATION_ONLY";
    rollingEnrollment: boolean;
    maxEnrollments: number | null;
    startDate: Date | null;
    endDate: Date | null;
    durationDays: number | null;
  };
};

export class RosterCapacityError extends ConflictError {
  constructor(message: string) {
    super(message, { outcome: "capacity" });
  }
}

const auditJson = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

const earliestDate = (...dates: Array<Date | null | undefined>) => {
  const populated = dates.filter((date): date is Date => Boolean(date));
  if (populated.length === 0) return null;
  return new Date(Math.min(...populated.map((date) => date.getTime())));
};

export const findProgramCohortScope = async (
  tx: ProgramCohortRosterTransaction,
  companyId: number,
  programId: number,
  cohortId: number,
): Promise<ProgramCohortScope> => {
  const scope = await tx.programCohort.findFirst({
    where: {
      id: cohortId,
      companyId,
      programId,
      program: { companyId, deletedAt: null },
    },
    select: {
      id: true,
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
  if (!scope) throw new NotFoundError("Program cohort");
  return scope;
};

export const assertProgramCohortEnrollmentWindow = (
  scope: ProgramCohortScope,
  now: Date,
) => {
  if (scope.program.status !== "ACTIVE" || scope.program.approvalStatus !== "APPROVED") {
    throw new ConflictError("Enrollment is only available for active, approved programs.");
  }

  const opensAt = scope.startDate ?? scope.program.startDate;
  const closesAt = scope.endDate ?? scope.program.endDate;
  if (opensAt && now.getTime() < opensAt.getTime()) {
    throw new ConflictError("The cohort enrollment window has not opened yet.");
  }
  if (closesAt && now.getTime() > closesAt.getTime()) {
    throw new ConflictError("The cohort enrollment window has closed.");
  }
};

export const programCohortEnrollmentDates = (
  scope: ProgramCohortScope,
  now: Date,
) => {
  const startDate = scope.program.rollingEnrollment
    ? now
    : (scope.startDate ?? scope.program.startDate ?? now);
  const rollingDueDate = scope.program.durationDays
    ? addDays(startDate, scope.program.durationDays)
    : null;
  const dueDate = scope.program.rollingEnrollment
    ? earliestDate(rollingDueDate, scope.endDate, scope.program.endDate)
    : (scope.endDate ?? scope.program.endDate ?? rollingDueDate);
  return { startDate, dueDate };
};

export const getProgramCohortCapacity = async (
  tx: ProgramCohortRosterTransaction,
  input: {
    companyId: number;
    programId: number;
    cohortId: number;
    scope: ProgramCohortScope;
    now: Date;
    excludeWaitlistEntryId?: number;
  },
) => {
  const offeredWhere = {
    companyId: input.companyId,
    programId: input.programId,
    status: "OFFERED" as const,
    offerExpiresAt: { gt: input.now },
    ...(input.excludeWaitlistEntryId
      ? { id: { not: input.excludeWaitlistEntryId } }
      : {}),
  };
  const [programEnrollments, cohortEnrollments, programOffers, cohortOffers] =
    await Promise.all([
      tx.programEnrollment.count({
        where: {
          companyId: input.companyId,
          programId: input.programId,
          deletedAt: null,
          enrollmentStatus: { in: [...LIVE_ENROLLMENT_STATUSES] },
        },
      }),
      tx.programEnrollment.count({
        where: {
          companyId: input.companyId,
          programId: input.programId,
          cohortId: input.cohortId,
          deletedAt: null,
          enrollmentStatus: { in: [...LIVE_ENROLLMENT_STATUSES] },
        },
      }),
      tx.programWaitlistEntry.count({ where: offeredWhere }),
      tx.programWaitlistEntry.count({
        where: { ...offeredWhere, cohortId: input.cohortId },
      }),
    ]);

  const programOccupied = programEnrollments + programOffers;
  const cohortOccupied = cohortEnrollments + cohortOffers;
  return {
    programEnrollments,
    cohortEnrollments,
    programOffers,
    cohortOffers,
    programOccupied,
    cohortOccupied,
    programAvailable:
      input.scope.program.maxEnrollments == null ||
      programOccupied < input.scope.program.maxEnrollments,
    cohortAvailable:
      input.scope.capacity == null || cohortOccupied < input.scope.capacity,
  };
};

export const assertProgramCohortCapacity = async (
  tx: ProgramCohortRosterTransaction,
  input: Parameters<typeof getProgramCohortCapacity>[1],
) => {
  const capacity = await getProgramCohortCapacity(tx, input);
  if (!capacity.programAvailable) {
    throw new RosterCapacityError("The program has reached its maximum enrollment capacity.");
  }
  if (!capacity.cohortAvailable) {
    throw new RosterCapacityError("The cohort has reached its enrollment capacity.");
  }
  return capacity;
};

export const createProgramCohortEnrollment = async (
  tx: ProgramCohortRosterTransaction,
  context: ProgramCohortRosterContext,
  input: {
    programId: number;
    cohortId: number;
    employeeId: string;
    scope: ProgramCohortScope;
    now: Date;
    excludeWaitlistEntryId?: number;
    auditAction?: string;
    source: ProgramEnrollmentSource;
  },
) => {
  assertProgramCohortEnrollmentWindow(input.scope, input.now);

  const employee = await tx.employee.findFirst({
    where: {
      id: input.employeeId,
      companyId: context.companyId,
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
      appUsers: {
        where: { companyId: context.companyId, isActive: true },
        select: { id: true },
      },
    },
  });
  if (!employee) {
    throw new ConflictError(
      "Employee must be active and belong to the authenticated company.",
    );
  }

  const duplicate = await tx.programEnrollment.findFirst({
    where: {
      companyId: context.companyId,
      employeeId: employee.id,
      programId: input.programId,
      deletedAt: null,
      enrollmentStatus: { in: [...LIVE_ENROLLMENT_STATUSES] },
    },
    select: { id: true },
  });
  if (duplicate) throw new ConflictError("Employee already has a live attempt for this program.");

  if (!input.excludeWaitlistEntryId) {
    const activeWaitlistEntry = await tx.programWaitlistEntry.findFirst({
      where: {
        companyId: context.companyId,
        programId: input.programId,
        employeeId: employee.id,
        status: { in: ["WAITING", "OFFERED"] },
      },
      select: { id: true },
    });
    if (activeWaitlistEntry) {
      throw new ConflictError(
        "Employee has an active waitlist entry that must be accepted or cancelled first.",
      );
    }
  }

  await assertProgramCohortCapacity(tx, {
    companyId: context.companyId,
    programId: input.programId,
    cohortId: input.cohortId,
    scope: input.scope,
    now: input.now,
    excludeWaitlistEntryId: input.excludeWaitlistEntryId,
  });

  const dates = programCohortEnrollmentDates(input.scope, input.now);
  const latestProgramAttempt = await tx.programEnrollment.aggregate({
    where: {
      employeeId: employee.id,
      programId: input.programId,
    },
    _max: { enrollmentNo: true },
  });
  const enrollmentNo = (latestProgramAttempt._max.enrollmentNo ?? 0) + 1;
  const programEnrollment = await tx.programEnrollment.create({
    data: {
      companyId: context.companyId,
      employeeId: employee.id,
      programId: input.programId,
      cohortId: input.cohortId,
      enrollmentNo,
      source: input.source,
      enrollmentStatus: "ACTIVE",
      enrolledAt: input.now,
      startDate: dates.startDate,
      dueDate: dates.dueDate,
      assignedBy: context.userId,
    },
    select: { id: true },
  });

  const courseEnrollmentSource: EnrollmentSource =
    input.source === "SELF_SERVICE" || input.source === "WAITLIST"
      ? "SELF_SERVICE"
      : input.source === "CSV_IMPORT"
        ? "CSV_IMPORT"
        : input.source === "HRIS_SYNC"
          ? "HRIS_SYNC"
          : input.source === "API"
            ? "API"
            : "ADMIN_ASSIGNED";

  const programCourses = await tx.programCourse.findMany({
    where: { companyId: context.companyId, programId: input.programId },
    select: { courseVersionId: true, isRequired: true, phaseNumber: true },
    orderBy: { displayOrder: "asc" },
  });
  const linkedCourseEnrollmentIds: number[] = [];

  for (const programCourse of programCourses) {
    const latestAttempt = await tx.enrollment.aggregate({
      where: {
        employeeId: employee.id,
        courseVersionId: programCourse.courseVersionId,
      },
      _max: { enrollmentNo: true },
    });
    const courseEnrollment = await tx.enrollment.create({
      data: {
        companyId: context.companyId,
        employeeId: employee.id,
        courseVersionId: programCourse.courseVersionId,
        programEnrollmentId: programEnrollment.id,
        enrollmentNo: (latestAttempt._max.enrollmentNo ?? 0) + 1,
        enrollmentType: "STANDARD",
        enrollmentSource: courseEnrollmentSource,
        status: programCourse.phaseNumber === 1 ? "ACTIVE" : "PENDING",
        enrolledAt: input.now,
        dueDate: dates.dueDate,
        assignedBy: context.userId,
      },
      select: { id: true },
    });
    linkedCourseEnrollmentIds.push(courseEnrollment.id);
    await tx.enrollmentActivityLog.create({
      data: {
        companyId: context.companyId,
        enrollmentId: courseEnrollment.id,
        activityType: "PROGRAM_COHORT_ENROLLED",
        currentStatus: programCourse.phaseNumber === 1 ? "ACTIVE" : "PENDING",
        performedBy: context.userId,
        metadata: {
          programId: input.programId,
          cohortId: input.cohortId,
          programEnrollmentId: programEnrollment.id,
          isRequired: programCourse.isRequired,
          phaseNumber: programCourse.phaseNumber,
          waitlistEntryId: input.excludeWaitlistEntryId ?? null,
        },
      },
    });
  }

  const enrollment = await tx.programEnrollment.findUniqueOrThrow({
    where: { id: programEnrollment.id },
    select: rosterEnrollmentSelect,
  });
  await tx.auditLog.create({
    data: {
      companyId: context.companyId,
      actorUserId: context.userId,
      entityType: "PROGRAM_ENROLLMENT",
      entityId: String(programEnrollment.id),
      action: input.auditAction ?? "COHORT_ENROLLED",
      afterJson: auditJson({
        programId: input.programId,
        cohortId: input.cohortId,
        employeeId: employee.id,
        enrollmentNo,
        source: input.source,
        waitlistEntryId: input.excludeWaitlistEntryId ?? null,
        linkedCourseEnrollmentIds,
      }),
    },
  });

  return {
    enrollment,
    linkedCourseEnrollmentIds,
    recipientUserIds: employee.appUsers.map((user) => user.id),
  };
};
