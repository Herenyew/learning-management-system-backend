import jwt from "jsonwebtoken";
import { Prisma, type PrismaClient } from "@prisma/client";
import {
  BusinessRuleError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../common/errors/http-errors.js";
import { Permissions } from "../../common/constants/permission.constant.js";
import { getPrismaClient } from "../../config/database.js";
import { enrollmentProgressService } from "../enrollments/enrollment-progress.service.js";
import { notificationDispatcher } from "../notifications/index.js";
import type { FinalizeAttendanceInput } from "./live-session-attendance.dto.js";
import {
  LiveSessionAttendanceRepository,
  type AttendanceTransaction,
} from "./live-session-attendance.repository.js";

type AttendanceContext = {
  companyId: number;
  userId: number;
  employeeId?: string;
  permissions: string[];
};
type ProgressEvaluator = Pick<typeof enrollmentProgressService, "reevaluateScoped">;
type NotificationDispatcher = Pick<typeof notificationDispatcher, "dispatch" | "deliverAfterCommit">;

const CHECK_IN_EARLY_MINUTES = 30;
const auditJson = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const secret = () => process.env.JWT_SECRET || "default-secret-change-me";

const attendanceSelect = {
  id: true,
  sessionId: true,
  enrollmentId: true,
  attendanceStatus: true,
  checkInTime: true,
  checkOutTime: true,
  attendancePercentage: true,
  remarks: true,
  deletedAt: true,
};

const audit = (
  tx: AttendanceTransaction,
  context: AttendanceContext,
  sessionId: number,
  action: string,
  before: unknown,
  after: unknown,
) =>
  tx.auditLog.create({
    data: {
      companyId: context.companyId,
      actorUserId: context.userId,
      entityType: "LIVE_SESSION_ATTENDANCE",
      entityId: String(sessionId),
      action,
      beforeJson: auditJson(before),
      afterJson: auditJson(after),
    },
  });

export class LiveSessionAttendanceService {
  constructor(
    private readonly repository: LiveSessionAttendanceRepository,
    private readonly prisma: PrismaClient,
    private readonly progress: ProgressEvaluator = enrollmentProgressService,
    private readonly notifier: NotificationDispatcher = notificationDispatcher,
  ) {}

  async listMine(context: AttendanceContext) {
    const canManage = context.permissions.includes(Permissions.ATTENDANCE_MANAGE);
    const canFinalize = context.permissions.includes(Permissions.ATTENDANCE_FINALIZE);
    if (!canManage && !canFinalize && !context.employeeId) {
      throw new ForbiddenError("An employee profile is required.");
    }
    const employeeId = context.employeeId;
    const accessWhere: Prisma.LiveSessionWhereInput = canManage
      ? {}
      : canFinalize
        ? {
            instructors: {
              some: {
                OR: [
                  { appUserId: context.userId },
                  ...(context.employeeId ? [{ employeeId: context.employeeId }] : []),
                ],
              },
            },
          }
        : {
            courseVersion: {
              enrollments: {
                some: {
                  companyId: context.companyId,
                  employeeId: employeeId!,
                  deletedAt: null,
                  status: { in: ["ACTIVE", "COMPLETED"] },
                },
              },
            },
          };
    return this.prisma.liveSession.findMany({
      where: {
        companyId: context.companyId,
        deletedAt: null,
        ...accessWhere,
      },
      select: {
        id: true,
        title: true,
        description: true,
        sessionType: true,
        status: true,
        startTime: true,
        endTime: true,
        timezone: true,
        venue: true,
        meetingUrl: true,
        attendanceRequired: true,
        courseVersion: { select: { course: { select: { id: true, title: true } } } },
        attendees: {
          where: {
            companyId: context.companyId,
            deletedAt: null,
            ...(context.employeeId
              ? { enrollment: { employeeId: context.employeeId, deletedAt: null } }
              : { id: -1 }),
          },
          select: attendanceSelect,
          take: 1,
        },
      },
      orderBy: [{ startTime: "asc" }, { id: "asc" }],
    });
  }

  async createChallenge(context: AttendanceContext, sessionId: number) {
    const session = await this.authorizedSession(context, sessionId);
    if (["COMPLETED", "CANCELLED"].includes(session.status)) {
      throw new BusinessRuleError("Check-in challenges are unavailable for closed sessions.");
    }
    return {
      challenge: jwt.sign(
        { purpose: "live-session-check-in", companyId: context.companyId, sessionId },
        secret(),
        { expiresIn: "5m" },
      ),
      expiresInSeconds: 300,
    };
  }

  async checkIn(
    context: AttendanceContext,
    sessionId: number,
    challenge: string,
    now = new Date(),
  ) {
    if (!context.employeeId) throw new ForbiddenError("An employee profile is required to check in.");
    let payload: any;
    try {
      payload = jwt.verify(challenge, secret());
    } catch {
      throw new ForbiddenError("Check-in challenge is invalid or expired.");
    }
    if (
      payload?.purpose !== "live-session-check-in" ||
      payload?.companyId !== context.companyId ||
      payload?.sessionId !== sessionId
    ) {
      throw new ForbiddenError("Check-in challenge does not match this session.");
    }

    const outcome = await this.repository.transaction(async (tx) => {
      const session = await tx.liveSession.findFirst({
        where: { id: sessionId, companyId: context.companyId, deletedAt: null },
      });
      if (!session) throw new NotFoundError("Live session");
      const opensAt = session.startTime.getTime() - CHECK_IN_EARLY_MINUTES * 60_000;
      if (
        !["SCHEDULED", "LIVE"].includes(session.status) ||
        now.getTime() < opensAt ||
        now.getTime() > session.endTime.getTime()
      ) {
        throw new BusinessRuleError("Check-in is not open for this session.");
      }
      const enrollments = await tx.enrollment.findMany({
        where: {
          companyId: context.companyId,
          employeeId: context.employeeId,
          courseVersionId: session.courseVersionId,
          status: "ACTIVE",
          deletedAt: null,
        },
        select: { id: true },
      });
      if (enrollments.length === 0) throw new ConflictError("No eligible course enrollment was found.");
      if (enrollments.length > 1) {
        throw new ConflictError("Multiple eligible enrollments were found; attendance cannot be assigned safely.");
      }
      const enrollmentId = enrollments[0].id;
      const existing = await tx.liveSessionAttendance.findUnique({
        where: { sessionId_enrollmentId: { sessionId, enrollmentId } },
        select: attendanceSelect,
      });
      if (existing?.checkInTime && existing.deletedAt == null) {
        return { attendance: existing, created: false, dispatch: null };
      }
      const method = await tx.attendanceMethod.findFirst({
        where: { companyId: context.companyId, slug: "qr_code", isActive: true },
        select: { id: true },
      });
      const attendance = await tx.liveSessionAttendance.upsert({
        where: { sessionId_enrollmentId: { sessionId, enrollmentId } },
        create: {
          companyId: context.companyId,
          sessionId,
          enrollmentId,
          attendanceStatus: "PARTIAL",
          attendanceMethodId: method?.id,
          checkInTime: now,
        },
        update: {
          deletedAt: null,
          attendanceStatus: "PARTIAL",
          attendanceMethodId: method?.id,
          checkInTime: now,
          checkOutTime: null,
          attendancePercentage: null,
          remarks: null,
        },
        select: attendanceSelect,
      });
      await audit(tx, context, sessionId, "CHECKED_IN", existing, attendance);
      const dispatch = await this.notifier.dispatch(tx, {
        companyId: context.companyId,
        eventCode: "LIVE_SESSION_CHECKED_IN",
        recipientUserIds: [context.userId],
        entityType: "LIVE_SESSION_ATTENDANCE",
        entityId: String(attendance.id),
        occurrenceKey: "checked-in",
        actionUrl: "/?screen=live-sessions",
        variables: { sessionTitle: session.title },
      });
      return { attendance, created: true, dispatch };
    });
    if (outcome.dispatch) await this.notifier.deliverAfterCommit(outcome.dispatch);
    return { attendance: outcome.attendance, created: outcome.created };
  }

  async roster(context: AttendanceContext, sessionId: number) {
    const session = await this.authorizedSession(context, sessionId);
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        companyId: context.companyId,
        courseVersionId: session.courseVersionId,
        status: { in: ["ACTIVE", "COMPLETED"] },
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
        employee: { select: { id: true, fullName: true } },
        liveSessionAttendances: {
          where: { sessionId, companyId: context.companyId, deletedAt: null },
          select: attendanceSelect,
          take: 1,
        },
      },
      orderBy: { employee: { fullName: "asc" } },
    });
    return { session, enrollments };
  }

  async finalize(
    context: AttendanceContext,
    sessionId: number,
    input: FinalizeAttendanceInput,
    now = new Date(),
  ) {
    const outcome = await this.repository.transaction(async (tx) => {
      const session = await this.authorizedSessionInTransaction(tx, context, sessionId);
      if (session.status === "CANCELLED") throw new BusinessRuleError("Cancelled sessions cannot be finalized.");
      const expected = await tx.enrollment.findMany({
        where: {
          companyId: context.companyId,
          courseVersionId: session.courseVersionId,
          status: { in: ["ACTIVE", "COMPLETED"] },
          deletedAt: null,
        },
        select: {
          id: true,
          employee: {
            select: {
              appUsers: {
                where: { companyId: context.companyId, isActive: true },
                select: { id: true },
              },
            },
          },
        },
        orderBy: { id: "asc" },
      });
      const expectedIds = expected.map((item) => item.id);
      const submittedIds = [...input.records.map((item) => item.enrollmentId)].sort((a, b) => a - b);
      if (
        expectedIds.length !== submittedIds.length ||
        expectedIds.some((value, index) => value !== submittedIds[index])
      ) {
        throw new BusinessRuleError("Attendance must include the complete eligible session roster.");
      }
      const normalized = input.records.map((record) => {
        let attendancePercentage = record.attendancePercentage ?? null;
        if (record.attendanceStatus === "PRESENT") attendancePercentage = attendancePercentage ?? 100;
        if (["ABSENT", "NO_SHOW"].includes(record.attendanceStatus)) attendancePercentage = 0;
        if (["LATE", "PARTIAL"].includes(record.attendanceStatus) && attendancePercentage == null) {
          throw new BusinessRuleError(`${record.attendanceStatus} attendance requires a percentage.`);
        }
        return { ...record, attendancePercentage };
      });

      const existing = await tx.liveSessionAttendance.findMany({
        where: { sessionId, companyId: context.companyId },
        select: attendanceSelect,
      });
      if (session.status === "COMPLETED") {
        const unchanged = normalized.every((record) => {
          const current = existing.find((item) => item.enrollmentId === record.enrollmentId);
          return (
            current?.attendanceStatus === record.attendanceStatus &&
            Number(current.attendancePercentage) === Number(record.attendancePercentage) &&
            (current.remarks ?? null) === (record.remarks ?? null)
          );
        });
        if (!unchanged) throw new ConflictError("Finalized attendance cannot be changed.");
        return {
          session,
          records: existing,
          enrollmentIds: expectedIds,
          idempotent: true,
          dispatches: [],
        };
      }
      if (now.getTime() < session.startTime.getTime()) {
        throw new BusinessRuleError("Attendance cannot be finalized before the session starts.");
      }

      const records = [];
      for (const record of normalized) {
        const current = existing.find((item) => item.enrollmentId === record.enrollmentId);
        records.push(
          await tx.liveSessionAttendance.upsert({
            where: { sessionId_enrollmentId: { sessionId, enrollmentId: record.enrollmentId } },
            create: {
              companyId: context.companyId,
              sessionId,
              enrollmentId: record.enrollmentId,
              attendanceStatus: record.attendanceStatus,
              attendancePercentage: record.attendancePercentage,
              remarks: record.remarks,
              checkOutTime: now,
            },
            update: {
              deletedAt: null,
              attendanceStatus: record.attendanceStatus,
              attendancePercentage: record.attendancePercentage,
              remarks: record.remarks,
              checkOutTime: current?.checkInTime && now > current.checkInTime ? now : null,
            },
            select: attendanceSelect,
          }),
        );
      }
      const completedSession = await tx.liveSession.update({
        where: { id: sessionId },
        data: { status: "COMPLETED", updatedBy: context.userId },
        select: { id: true, status: true, courseVersionId: true },
      });
      await audit(tx, context, sessionId, "FINALIZED", existing, records);
      const dispatches = [];
      for (const enrollment of expected) {
        const record = records.find((item) => item.enrollmentId === enrollment.id);
        if (!record) continue;
        const recipientUserIds = enrollment.employee?.appUsers.map((user) => user.id) ?? [];
        if (recipientUserIds.length === 0) continue;
        dispatches.push(await this.notifier.dispatch(tx, {
          companyId: context.companyId,
          eventCode: "ATTENDANCE_FINALIZED",
          recipientUserIds,
          entityType: "LIVE_SESSION_ATTENDANCE",
          entityId: String(record.id),
          occurrenceKey: "finalized",
          actionUrl: "/?screen=live-sessions",
          variables: {
            sessionTitle: session.title,
            attendanceStatus: record.attendanceStatus.replaceAll("_", " ").toLowerCase(),
          },
        }));
      }
      return {
        session: completedSession,
        records,
        enrollmentIds: expectedIds,
        idempotent: false,
        dispatches,
      };
    });

    await Promise.all(
      outcome.dispatches.map((dispatch) => this.notifier.deliverAfterCommit(dispatch)),
    );
    if (!outcome.idempotent) {
      for (const enrollmentId of outcome.enrollmentIds) {
        await this.progress.reevaluateScoped(context, enrollmentId, now);
      }
    }
    return outcome;
  }

  private async authorizedSession(context: AttendanceContext, sessionId: number) {
    const session = await this.prisma.liveSession.findFirst({
      where: { id: sessionId, companyId: context.companyId, deletedAt: null },
      include: { instructors: true },
    });
    if (!session) throw new NotFoundError("Live session");
    this.assertCanFinalize(context, session.instructors);
    return session;
  }

  private async authorizedSessionInTransaction(
    tx: AttendanceTransaction,
    context: AttendanceContext,
    sessionId: number,
  ) {
    const session = await tx.liveSession.findFirst({
      where: { id: sessionId, companyId: context.companyId, deletedAt: null },
      include: { instructors: true },
    });
    if (!session) throw new NotFoundError("Live session");
    this.assertCanFinalize(context, session.instructors);
    return session;
  }

  private assertCanFinalize(
    context: AttendanceContext,
    instructors: Array<{ appUserId: number | null; employeeId: string | null }>,
  ) {
    if (context.permissions.includes(Permissions.ATTENDANCE_MANAGE)) return;
    if (!context.permissions.includes(Permissions.ATTENDANCE_FINALIZE)) {
      throw new ForbiddenError("Attendance finalization permission is required.");
    }
    const assigned = instructors.some(
      (item) => item.appUserId === context.userId || (context.employeeId && item.employeeId === context.employeeId),
    );
    if (!assigned) throw new ForbiddenError("Only an assigned session instructor may finalize attendance.");
  }
}

const prisma = getPrismaClient();
export const liveSessionAttendanceService = new LiveSessionAttendanceService(
  new LiveSessionAttendanceRepository(prisma),
  prisma,
);
