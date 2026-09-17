import { Prisma, type WaitlistStatus } from "@prisma/client";
import { ConflictError, NotFoundError } from "../../common/errors/http-errors.js";
import logger from "../../config/logger.js";
import { notificationDispatcher } from "../notifications/index.js";
import {
  assertProgramCohortEnrollmentWindow,
  createProgramCohortEnrollment,
  findProgramCohortScope,
  getProgramCohortCapacity,
  type ProgramCohortScope,
} from "./program-cohort-enrollment.js";
import {
  ProgramCohortRosterRepository,
  programWaitlistEntrySelect,
  rosterEnrollmentSelect,
} from "./program-cohort-roster.repository.js";
import type {
  JoinProgramCohortWaitlistInput,
  ProgramCohortRosterContext,
  ProgramCohortRosterTransaction,
} from "./program-cohort-roster.types.js";

const DEFAULT_WAITLIST_SIZE = 20;
const DEFAULT_RESPONSE_HOURS = 48;
const ACTIVE_WAITLIST_STATUSES: WaitlistStatus[] = ["WAITING", "OFFERED"];

type NotificationDispatcher = Pick<
  typeof notificationDispatcher,
  "dispatch" | "deliverAfterCommit"
>;
type DispatchResult = Awaited<ReturnType<NotificationDispatcher["dispatch"]>>;

const auditJson = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

const activeKey = (companyId: number, programId: number, employeeId: string) =>
  `${companyId}:${programId}:${employeeId}`;

const positiveIntegerSetting = (value: Prisma.JsonValue | undefined, fallback: number) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export class ProgramCohortWaitlistService {
  constructor(
    private readonly repository: ProgramCohortRosterRepository,
    private readonly notifier: NotificationDispatcher = notificationDispatcher,
  ) {}

  private async settings(tx: ProgramCohortRosterTransaction, companyId: number) {
    const rows = await tx.systemSetting.findMany({
      where: {
        companyId,
        settingKey: {
          in: ["default_waitlist_size", "default_waitlist_response_hours"],
        },
        isActive: true,
      },
      select: { settingKey: true, settingValue: true },
    });
    const values = new Map(rows.map((row) => [row.settingKey, row.settingValue]));
    return {
      waitlistSize: positiveIntegerSetting(
        values.get("default_waitlist_size"),
        DEFAULT_WAITLIST_SIZE,
      ),
      responseHours: positiveIntegerSetting(
        values.get("default_waitlist_response_hours"),
        DEFAULT_RESPONSE_HOURS,
      ),
    };
  }

  private variables(scope: ProgramCohortScope) {
    return {
      programTitle: scope.program.name,
      cohortName: scope.name,
    };
  }

  private recipientIds(entry: {
    employee: { appUsers: Array<{ id: number }> };
  }) {
    return entry.employee.appUsers.map((user) => user.id);
  }

  private async expireOverdueOffers(
    tx: ProgramCohortRosterTransaction,
    context: ProgramCohortRosterContext,
    scope: ProgramCohortScope,
    now: Date,
  ) {
    const overdue = await tx.programWaitlistEntry.findMany({
      where: {
        companyId: context.companyId,
        programId: scope.program.id,
        cohortId: scope.id,
        status: "OFFERED",
        offerExpiresAt: { lte: now },
      },
      select: {
        id: true,
        employeeId: true,
        position: true,
        employee: {
          select: {
            appUsers: {
              where: { companyId: context.companyId, isActive: true },
              select: { id: true },
            },
          },
        },
      },
      orderBy: [{ position: "asc" }, { id: "asc" }],
    });
    const dispatches: DispatchResult[] = [];

    for (const entry of overdue) {
      const updated = await tx.programWaitlistEntry.updateMany({
        where: { id: entry.id, companyId: context.companyId, status: "OFFERED" },
        data: {
          status: "EXPIRED",
          activeKey: null,
          expiredAt: now,
        },
      });
      if (updated.count === 0) continue;
      await tx.auditLog.create({
        data: {
          companyId: context.companyId,
          actorUserId: context.userId,
          entityType: "PROGRAM_WAITLIST_ENTRY",
          entityId: String(entry.id),
          action: "EXPIRED",
          beforeJson: auditJson({ status: "OFFERED" }),
          afterJson: auditJson({ status: "EXPIRED", expiredAt: now }),
        },
      });
      dispatches.push(
        await this.notifier.dispatch(tx, {
          companyId: context.companyId,
          eventCode: "PROGRAM_WAITLIST_EXPIRED",
          recipientUserIds: this.recipientIds(entry),
          entityType: "PROGRAM_WAITLIST_ENTRY",
          entityId: String(entry.id),
          occurrenceKey: "expired",
          actionUrl: `/?screen=my-programs&programId=${scope.program.id}`,
          variables: this.variables(scope),
        }),
      );
    }
    return { expired: overdue.length, dispatches };
  }

  private async deliver(dispatches: DispatchResult[]) {
    await Promise.all(
      dispatches.map((dispatch) => this.notifier.deliverAfterCommit(dispatch)),
    );
  }

  private async promoteAfterCommit(
    context: ProgramCohortRosterContext,
    programId: number,
    cohortId: number,
    now: Date,
  ) {
    try {
      await this.process(context, programId, cohortId, now);
    } catch (error) {
      logger.error("[ProgramCohortWaitlist] Promotion failed after a committed change", {
        error,
        companyId: context.companyId,
        programId,
        cohortId,
      });
    }
  }

  async getWaitlist(companyId: number, programId: number, cohortId: number) {
    const waitlist = await this.repository.listWaitlist(companyId, programId, cohortId);
    if (!waitlist) throw new NotFoundError("Program cohort");
    return waitlist;
  }

  async join(
    context: ProgramCohortRosterContext,
    programId: number,
    cohortId: number,
    input: JoinProgramCohortWaitlistInput,
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
        assertProgramCohortEnrollmentWindow(scope, now);
        const expiry = await this.expireOverdueOffers(tx, context, scope, now);

        const employee = await tx.employee.findFirst({
          where: { id: input.employeeId, companyId: context.companyId, isActive: true },
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

        const enrollment = await tx.programEnrollment.findFirst({
          where: {
            companyId: context.companyId,
            employeeId: employee.id,
            programId,
            deletedAt: null,
            enrollmentStatus: { in: ["PENDING", "WAITLISTED", "ACTIVE"] },
          },
          select: { id: true },
        });
        if (enrollment) throw new ConflictError("Employee already has a live attempt for this program.");

        const existing = await tx.programWaitlistEntry.findFirst({
          where: {
            companyId: context.companyId,
            programId,
            employeeId: employee.id,
            status: { in: ACTIVE_WAITLIST_STATUSES },
          },
          select: programWaitlistEntrySelect,
        });
        if (existing) throw new ConflictError("Employee already has an active waitlist entry.");

        const capacity = await getProgramCohortCapacity(tx, {
          companyId: context.companyId,
          programId,
          cohortId,
          scope,
          now,
        });
        if (capacity.programAvailable && capacity.cohortAvailable) {
          throw new ConflictError(
            "Enrollment capacity is available; enroll the employee directly instead of waitlisting.",
          );
        }

        const config = await this.settings(tx, context.companyId);
        const activeCount = await tx.programWaitlistEntry.count({
          where: {
            companyId: context.companyId,
            programId,
            cohortId,
            status: { in: ACTIVE_WAITLIST_STATUSES },
          },
        });
        if (activeCount >= config.waitlistSize) {
          throw new ConflictError("The cohort waitlist has reached its configured maximum size.");
        }

        const maximum = await tx.programWaitlistEntry.aggregate({
          where: { companyId: context.companyId, programId, cohortId },
          _max: { position: true },
        });
        const entry = await tx.programWaitlistEntry.create({
          data: {
            companyId: context.companyId,
            programId,
            cohortId,
            employeeId: employee.id,
            position: (maximum._max.position ?? 0) + 1,
            status: "WAITING",
            activeKey: activeKey(context.companyId, programId, employee.id),
          },
          select: programWaitlistEntrySelect,
        });
        await tx.auditLog.create({
          data: {
            companyId: context.companyId,
            actorUserId: context.userId,
            entityType: "PROGRAM_WAITLIST_ENTRY",
            entityId: String(entry.id),
            action: "JOINED",
            afterJson: auditJson({
              programId,
              cohortId,
              employeeId: employee.id,
              position: entry.position,
              status: entry.status,
            }),
          },
        });
        const joinedDispatch = await this.notifier.dispatch(tx, {
          companyId: context.companyId,
          eventCode: "PROGRAM_WAITLIST_JOINED",
          recipientUserIds: employee.appUsers.map((user) => user.id),
          entityType: "PROGRAM_WAITLIST_ENTRY",
          entityId: String(entry.id),
          occurrenceKey: "joined",
          actionUrl: `/?screen=my-programs&programId=${programId}`,
          variables: { ...this.variables(scope), position: entry.position },
        });
        return {
          entry,
          config,
          dispatches: [...expiry.dispatches, joinedDispatch],
        };
      });
      await this.deliver(result.dispatches);
      return { entry: result.entry, settings: result.config };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictError("Employee already has an active waitlist entry.");
      }
      throw error;
    }
  }

  async cancel(
    context: ProgramCohortRosterContext,
    programId: number,
    cohortId: number,
    entryId: number,
    now = new Date(),
  ) {
    const result = await this.repository.transaction(async (tx) => {
      const scope = await findProgramCohortScope(
        tx,
        context.companyId,
        programId,
        cohortId,
      );
      const entry = await tx.programWaitlistEntry.findFirst({
        where: { id: entryId, companyId: context.companyId, programId, cohortId },
        select: {
          ...programWaitlistEntrySelect,
          employee: {
            select: {
              id: true,
              fullName: true,
              isActive: true,
              appUsers: {
                where: { companyId: context.companyId, isActive: true },
                select: { id: true },
              },
            },
          },
        },
      });
      if (!entry) throw new NotFoundError("Program waitlist entry");
      if (entry.status === "CANCELLED") return { entry, dispatches: [] as DispatchResult[] };
      if (entry.status !== "WAITING" && entry.status !== "OFFERED") {
        throw new ConflictError(`A ${entry.status} waitlist entry cannot be cancelled.`);
      }

      const updated = await tx.programWaitlistEntry.update({
        where: { id: entry.id },
        data: { status: "CANCELLED", activeKey: null, cancelledAt: now },
        select: programWaitlistEntrySelect,
      });
      await tx.auditLog.create({
        data: {
          companyId: context.companyId,
          actorUserId: context.userId,
          entityType: "PROGRAM_WAITLIST_ENTRY",
          entityId: String(entry.id),
          action: "CANCELLED",
          beforeJson: auditJson({ status: entry.status }),
          afterJson: auditJson({ status: "CANCELLED", cancelledAt: now }),
        },
      });
      const dispatch = await this.notifier.dispatch(tx, {
        companyId: context.companyId,
        eventCode: "PROGRAM_WAITLIST_CANCELLED",
        recipientUserIds: this.recipientIds(entry),
        entityType: "PROGRAM_WAITLIST_ENTRY",
        entityId: String(entry.id),
        occurrenceKey: "cancelled",
        actionUrl: `/?screen=my-programs&programId=${programId}`,
        variables: this.variables(scope),
      });
      return { entry: updated, dispatches: [dispatch] };
    });
    await this.deliver(result.dispatches);
    if (result.dispatches.length > 0) {
      await this.promoteAfterCommit(context, programId, cohortId, now);
    }
    return result.entry;
  }

  async process(
    context: ProgramCohortRosterContext,
    programId: number,
    cohortId: number,
    now = new Date(),
  ) {
    const result = await this.repository.transaction(async (tx) => {
      const scope = await findProgramCohortScope(
        tx,
        context.companyId,
        programId,
        cohortId,
      );
      const expiry = await this.expireOverdueOffers(tx, context, scope, now);
      if (scope.program.status !== "ACTIVE") {
        return { expired: expiry.expired, offered: null, dispatches: expiry.dispatches };
      }
      const opensAt = scope.startDate ?? scope.program.startDate;
      const closesAt = scope.endDate ?? scope.program.endDate;
      if (
        (opensAt && now.getTime() < opensAt.getTime()) ||
        (closesAt && now.getTime() > closesAt.getTime())
      ) {
        return { expired: expiry.expired, offered: null, dispatches: expiry.dispatches };
      }

      const capacity = await getProgramCohortCapacity(tx, {
        companyId: context.companyId,
        programId,
        cohortId,
        scope,
        now,
      });
      if (!capacity.programAvailable || !capacity.cohortAvailable) {
        return { expired: expiry.expired, offered: null, dispatches: expiry.dispatches };
      }

      const waiting = await tx.programWaitlistEntry.findFirst({
        where: {
          companyId: context.companyId,
          programId,
          cohortId,
          status: "WAITING",
        },
        select: {
          id: true,
          employeeId: true,
          position: true,
          employee: {
            select: {
              appUsers: {
                where: { companyId: context.companyId, isActive: true },
                select: { id: true },
              },
            },
          },
        },
        orderBy: [{ position: "asc" }, { id: "asc" }],
      });
      if (!waiting) {
        return { expired: expiry.expired, offered: null, dispatches: expiry.dispatches };
      }

      const config = await this.settings(tx, context.companyId);
      const offerExpiresAt = new Date(
        now.getTime() + config.responseHours * 60 * 60 * 1000,
      );
      const claimed = await tx.programWaitlistEntry.updateMany({
        where: { id: waiting.id, companyId: context.companyId, status: "WAITING" },
        data: { status: "OFFERED", offeredAt: now, offerExpiresAt },
      });
      if (claimed.count === 0) {
        return { expired: expiry.expired, offered: null, dispatches: expiry.dispatches };
      }
      const offered = await tx.programWaitlistEntry.findUniqueOrThrow({
        where: { id: waiting.id },
        select: programWaitlistEntrySelect,
      });
      await tx.auditLog.create({
        data: {
          companyId: context.companyId,
          actorUserId: context.userId,
          entityType: "PROGRAM_WAITLIST_ENTRY",
          entityId: String(waiting.id),
          action: "OFFERED",
          beforeJson: auditJson({ status: "WAITING", position: waiting.position }),
          afterJson: auditJson({ status: "OFFERED", offeredAt: now, offerExpiresAt }),
        },
      });
      const dispatch = await this.notifier.dispatch(tx, {
        companyId: context.companyId,
        eventCode: "PROGRAM_WAITLIST_OFFERED",
        recipientUserIds: this.recipientIds(waiting),
        entityType: "PROGRAM_WAITLIST_ENTRY",
        entityId: String(waiting.id),
        occurrenceKey: `offered:${offerExpiresAt.toISOString()}`,
        actionUrl: `/?screen=my-programs&programId=${programId}`,
        variables: {
          ...this.variables(scope),
          offerExpiresAt: offerExpiresAt.toISOString(),
        },
      });
      return {
        expired: expiry.expired,
        offered,
        dispatches: [...expiry.dispatches, dispatch],
      };
    });
    await this.deliver(result.dispatches);
    return {
      expired: result.expired,
      offered: result.offered,
    };
  }

  async accept(
    context: ProgramCohortRosterContext,
    programId: number,
    cohortId: number,
    entryId: number,
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
        const entry = await tx.programWaitlistEntry.findFirst({
          where: { id: entryId, companyId: context.companyId, programId, cohortId },
          select: {
            id: true,
            employeeId: true,
            position: true,
            status: true,
            offeredAt: true,
            offerExpiresAt: true,
            programEnrollmentId: true,
            employee: {
              select: {
                appUsers: {
                  where: { companyId: context.companyId, isActive: true },
                  select: { id: true },
                },
              },
            },
          },
        });
        if (!entry) throw new NotFoundError("Program waitlist entry");

        if (entry.status === "ACCEPTED") {
          if (!entry.programEnrollmentId) {
            throw new ConflictError(
              "This legacy accepted waitlist entry is not linked to an exact program attempt.",
            );
          }
          const enrollment = await tx.programEnrollment.findFirst({
            where: {
              id: entry.programEnrollmentId,
              companyId: context.companyId,
              employeeId: entry.employeeId,
              programId,
              cohortId,
            },
            select: rosterEnrollmentSelect,
          });
          if (!enrollment) {
            throw new ConflictError(
              "The accepted waitlist entry has no matching program enrollment.",
            );
          }
          return {
            accepted: true as const,
            idempotent: true,
            entry,
            enrollment,
            linkedCourseEnrollmentIds: enrollment.enrollments.map((item) => item.id),
            dispatches: [] as DispatchResult[],
          };
        }
        if (entry.status !== "OFFERED") {
          throw new ConflictError("Only an OFFERED waitlist entry can be accepted.");
        }
        if (!entry.offerExpiresAt || entry.offerExpiresAt.getTime() <= now.getTime()) {
          const expired = await tx.programWaitlistEntry.update({
            where: { id: entry.id },
            data: { status: "EXPIRED", activeKey: null, expiredAt: now },
            select: programWaitlistEntrySelect,
          });
          await tx.auditLog.create({
            data: {
              companyId: context.companyId,
              actorUserId: context.userId,
              entityType: "PROGRAM_WAITLIST_ENTRY",
              entityId: String(entry.id),
              action: "EXPIRED",
              beforeJson: auditJson({ status: "OFFERED" }),
              afterJson: auditJson({ status: "EXPIRED", expiredAt: now }),
            },
          });
          const dispatch = await this.notifier.dispatch(tx, {
            companyId: context.companyId,
            eventCode: "PROGRAM_WAITLIST_EXPIRED",
            recipientUserIds: this.recipientIds(entry),
            entityType: "PROGRAM_WAITLIST_ENTRY",
            entityId: String(entry.id),
            occurrenceKey: "expired",
            actionUrl: `/?screen=my-programs&programId=${programId}`,
            variables: this.variables(scope),
          });
          return {
            accepted: false as const,
            expired,
            dispatches: [dispatch],
          };
        }

        const created = await createProgramCohortEnrollment(tx, context, {
          programId,
          cohortId,
          employeeId: entry.employeeId,
          scope,
          now,
          excludeWaitlistEntryId: entry.id,
          auditAction: "WAITLIST_ACCEPTED_ENROLLMENT",
          source: "WAITLIST",
        });
        const accepted = await tx.programWaitlistEntry.update({
          where: { id: entry.id },
          data: {
            status: "ACCEPTED",
            activeKey: null,
            acceptedAt: now,
            programEnrollmentId: created.enrollment.id,
          },
          select: programWaitlistEntrySelect,
        });
        await tx.auditLog.create({
          data: {
            companyId: context.companyId,
            actorUserId: context.userId,
            entityType: "PROGRAM_WAITLIST_ENTRY",
            entityId: String(entry.id),
            action: "ACCEPTED",
            beforeJson: auditJson({ status: "OFFERED" }),
            afterJson: auditJson({
              status: "ACCEPTED",
              acceptedAt: now,
              programEnrollmentId: created.enrollment.id,
            }),
          },
        });
        const dispatch = await this.notifier.dispatch(tx, {
          companyId: context.companyId,
          eventCode: "PROGRAM_WAITLIST_ACCEPTED",
          recipientUserIds: created.recipientUserIds,
          entityType: "PROGRAM_WAITLIST_ENTRY",
          entityId: String(entry.id),
          occurrenceKey: "accepted",
          actionUrl: `/?screen=my-programs&programId=${programId}`,
          variables: this.variables(scope),
        });
        return {
          accepted: true as const,
          idempotent: false,
          entry: accepted,
          enrollment: created.enrollment,
          linkedCourseEnrollmentIds: created.linkedCourseEnrollmentIds,
          dispatches: [dispatch],
        };
      });
      await this.deliver(result.dispatches);
      if (!result.accepted) {
        await this.promoteAfterCommit(context, programId, cohortId, now);
        throw new ConflictError("The waitlist offer has expired.");
      }
      return {
        entry: result.entry,
        enrollment: result.enrollment,
        linkedCourseEnrollmentIds: result.linkedCourseEnrollmentIds,
        idempotent: result.idempotent,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictError("Employee is already enrolled in this program.");
      }
      throw error;
    }
  }
}
