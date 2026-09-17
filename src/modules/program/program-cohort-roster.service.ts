import { Prisma, type ProgramEnrollmentSource } from "@prisma/client";
import { AppError } from "../../common/errors/app-error.js";
import {
  ConflictError,
  NotFoundError,
} from "../../common/errors/http-errors.js";
import logger from "../../config/logger.js";
import { notificationDispatcher } from "../notifications/index.js";
import {
  createProgramCohortEnrollment,
  findProgramCohortScope,
} from "./program-cohort-enrollment.js";
import { ProgramCohortRosterRepository } from "./program-cohort-roster.repository.js";
import type {
  BulkProgramCohortEnrollmentInput,
  CreateProgramCohortEnrollmentInput,
  ProgramCohortBulkOutcome,
  ProgramCohortRosterContext,
  ProgramCohortRosterTransaction,
} from "./program-cohort-roster.types.js";

const auditJson = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;


type NotificationDispatcher = Pick<
  typeof notificationDispatcher,
  "dispatch" | "deliverAfterCommit"
>;

export class ProgramCohortRosterService {
  private capacityReleasedHandler?: (
    context: ProgramCohortRosterContext,
    programId: number,
    cohortId: number,
  ) => Promise<unknown>;

  constructor(
    private readonly repository: ProgramCohortRosterRepository,
    private readonly notifier: NotificationDispatcher = notificationDispatcher,
  ) {}


  setCapacityReleasedHandler(
    handler: (
      context: ProgramCohortRosterContext,
      programId: number,
      cohortId: number,
    ) => Promise<unknown>,
  ) {
    this.capacityReleasedHandler = handler;
  }

  async getRoster(companyId: number, programId: number, cohortId: number) {
    const roster = await this.repository.listRoster(companyId, programId, cohortId);
    if (!roster) throw new NotFoundError("Program cohort");
    return roster;
  }

  async enrollEmployee(
    context: ProgramCohortRosterContext,
    programId: number,
    cohortId: number,
    input: CreateProgramCohortEnrollmentInput,
    now = new Date(),
  ) {
    try {
      const result = await this.repository.transaction(async (tx) => {
        const scope = await findProgramCohortScope(
          tx,
          context.companyId,
          programId,
          cohortId,
        );
        const created = await createProgramCohortEnrollment(tx, context, {
          programId,
          cohortId,
          employeeId: input.employeeId,
          scope,
          now,
          source: "ADMIN_ASSIGNED",
        });
        const dispatch = await this.notifier.dispatch(tx, {
          companyId: context.companyId,
          eventCode: "PROGRAM_ENROLLMENT_CONFIRMED",
          recipientUserIds: created.recipientUserIds,
          entityType: "PROGRAM_ENROLLMENT",
          entityId: String(created.enrollment.id),
          occurrenceKey: "cohort-enrolled",
          actionUrl: `/?screen=my-programs&programId=${programId}`,
          variables: { programTitle: scope.program.name },
        });
        return { ...created, dispatch };
      });

      await this.notifier.deliverAfterCommit(result.dispatch);
      return {
        enrollment: result.enrollment,
        linkedCourseEnrollmentIds: result.linkedCourseEnrollmentIds,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictError("Employee is already enrolled in this program.");
      }
      throw error;
    }
  }

  async enrollCurrentUser(
    context: ProgramCohortRosterContext,
    programId: number,
    cohortId: number,
    source: Extract<ProgramEnrollmentSource, "SELF_SERVICE" | "API">,
    now = new Date(),
  ) {
    const appUser = await this.repository.findActiveUserEmployee(
      context.companyId,
      context.userId,
    );
    if (!appUser?.employeeId) {
      throw new ConflictError("Authenticated user has no active employee profile.");
    }
    const scope = await this.repository.findScope(context.companyId, programId, cohortId);
    if (!scope) throw new NotFoundError("Program cohort");
    if (
      scope.program.visibility === "ENROLLED_ONLY" ||
      scope.program.visibility === "INVITATION_ONLY"
    ) {
      throw new ConflictError("This program does not allow self-service enrollment.");
    }

    try {
      const result = await this.repository.transaction(async (tx) => {
        const transactionScope = await findProgramCohortScope(
          tx,
          context.companyId,
          programId,
          cohortId,
        );
        const created = await createProgramCohortEnrollment(tx, context, {
          programId,
          cohortId,
          employeeId: appUser.employeeId!,
          scope: transactionScope,
          now,
          source,
        });
        const dispatch = await this.notifier.dispatch(tx, {
          companyId: context.companyId,
          eventCode: "PROGRAM_ENROLLMENT_CONFIRMED",
          recipientUserIds: created.recipientUserIds,
          entityType: "PROGRAM_ENROLLMENT",
          entityId: String(created.enrollment.id),
          occurrenceKey: `attempt:${created.enrollment.enrollmentNo}`,
          actionUrl: `/?screen=my-programs&programId=${programId}`,
          variables: { programTitle: transactionScope.program.name },
        });
        return { ...created, dispatch };
      });
      await this.notifier.deliverAfterCommit(result.dispatch);
      return {
        enrollment: result.enrollment,
        linkedCourseEnrollmentIds: result.linkedCourseEnrollmentIds,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictError("A live attempt already exists for this program.");
      }
      throw error;
    }
  }

  async bulkEnrollEmployees(
    context: ProgramCohortRosterContext,
    programId: number,
    cohortId: number,
    input: BulkProgramCohortEnrollmentInput,
  ) {
    const scope = await this.repository.findScope(context.companyId, programId, cohortId);
    if (!scope) throw new NotFoundError("Program cohort");

    const outcomes: ProgramCohortBulkOutcome[] = [];
    for (const employeeId of input.employeeIds) {
      try {
        const result = await this.enrollEmployee(context, programId, cohortId, { employeeId });
        outcomes.push({
          employeeId,
          status: "enrolled",
          enrollmentId: result.enrollment.id,
          linkedCourseEnrollmentIds: result.linkedCourseEnrollmentIds,
        });
      } catch (error) {
        if (error instanceof AppError && error.statusCode === 409) {
          const capacity =
            typeof error.details === "object" &&
            error.details !== null &&
            "outcome" in error.details &&
            error.details.outcome === "capacity";
          outcomes.push({
            employeeId,
            status: capacity ? "capacity" : "conflict",
            message: error.message,
          });
          continue;
        }
        throw error;
      }
    }

    return {
      outcomes,
      summary: {
        requested: input.employeeIds.length,
        enrolled: outcomes.filter((outcome) => outcome.status === "enrolled").length,
        conflict: outcomes.filter((outcome) => outcome.status === "conflict").length,
        capacity: outcomes.filter((outcome) => outcome.status === "capacity").length,
      },
    };
  }

  async removeEnrollment(
    context: ProgramCohortRosterContext,
    programId: number,
    cohortId: number,
    enrollmentId: number,
    now = new Date(),
  ) {
    const result = await this.repository.transaction(async (tx) => {
      await findProgramCohortScope(tx, context.companyId, programId, cohortId);
      const enrollment = await tx.programEnrollment.findFirst({
        where: {
          id: enrollmentId,
          companyId: context.companyId,
          programId,
          cohortId,
          deletedAt: null,
        },
        select: {
          id: true,
          employeeId: true,
          enrollmentStatus: true,
          completedAt: true,
          completion: { select: { id: true } },
          milestoneProgresses: { select: { id: true }, take: 1 },
          enrollments: {
            select: {
              id: true,
              status: true,
              completion: { select: { id: true } },
            },
          },
        },
      });
      if (!enrollment) throw new NotFoundError("Program enrollment");

      const hasCompletedCourse = enrollment.enrollments.some(
        (course) => course.status === "COMPLETED" || Boolean(course.completion),
      );
      if (
        enrollment.enrollmentStatus === "COMPLETED" ||
        enrollment.completedAt ||
        enrollment.completion ||
        hasCompletedCourse
      ) {
        throw new ConflictError("Completed program or course enrollments cannot be removed.");
      }
      if (enrollment.milestoneProgresses.length > 0) {
        throw new ConflictError("An enrollment with milestone progress cannot be removed.");
      }

      for (const courseEnrollment of enrollment.enrollments) {
        await tx.enrollment.update({
          where: { id: courseEnrollment.id },
          data: {
            status: "CANCELLED",
            cancelledAt: now,
            cancelledReason: "Removed from program cohort roster.",
            deletedAt: now,
            updatedAt: now,
          },
        });
        await tx.enrollmentActivityLog.create({
          data: {
            companyId: context.companyId,
            enrollmentId: courseEnrollment.id,
            activityType: "PROGRAM_COHORT_REMOVED",
            previousStatus: courseEnrollment.status,
            currentStatus: "CANCELLED",
            performedBy: context.userId,
            metadata: { programId, cohortId, programEnrollmentId: enrollment.id },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          companyId: context.companyId,
          actorUserId: context.userId,
          entityType: "PROGRAM_ENROLLMENT",
          entityId: String(enrollment.id),
          action: "COHORT_REMOVED",
          beforeJson: auditJson({
            programId,
            cohortId,
            employeeId: enrollment.employeeId,
            linkedCourseEnrollmentIds: enrollment.enrollments.map((course) => course.id),
          }),
        },
      });
      await tx.programEnrollment.update({
        where: { id: enrollment.id },
        data: {
          enrollmentStatus: "CANCELLED",
          deletedAt: now,
        },
      });

      return {
        id: enrollment.id,
        employeeId: enrollment.employeeId,
        removed: true,
        cancelledCourseEnrollmentIds: enrollment.enrollments.map((course) => course.id),
      };
    });

    if (this.capacityReleasedHandler) {
      try {
        await this.capacityReleasedHandler(context, programId, cohortId);
      } catch (error) {
        logger.error("[ProgramCohortRoster] Waitlist promotion failed after roster removal", {
          error,
          companyId: context.companyId,
          programId,
          cohortId,
        });
      }
    }
    return result;
  }
}
