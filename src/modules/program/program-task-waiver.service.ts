import { Prisma, type PrismaClient } from "@prisma/client";
import {
  ConflictError,
  NotFoundError,
} from "../../common/errors/http-errors.js";
import { getPrismaClient } from "../../config/database.js";
import { enrollmentProgressService } from "../enrollments/enrollment-progress.service.js";
import type {
  ProgramTaskWaiverParams,
  WaiveProgramTaskInput,
} from "./program-task-waiver.dto.js";

type WaiverContext = { companyId: number; userId: number };
type ProgramEvaluator = Pick<typeof enrollmentProgressService, "reevaluateProgramScoped">;

const auditJson = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

const progressSelect = {
  id: true,
  companyId: true,
  programTaskId: true,
  programEnrollmentId: true,
  status: true,
  completedAt: true,
  waivedAt: true,
  waivedBy: true,
  waiverReason: true,
  createdAt: true,
  updatedAt: true,
};

export class ProgramTaskWaiverService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly evaluator: ProgramEvaluator = enrollmentProgressService,
  ) {}

  async waive(
    context: WaiverContext,
    params: ProgramTaskWaiverParams,
    input: WaiveProgramTaskInput,
    now = new Date(),
  ) {
    await this.prisma.$transaction(async (tx) => {
      const { enrollment, task } = await this.scopedResources(tx, context, params);
      this.assertMutableAttempt(enrollment);

      const existing = await tx.programTaskProgress.findUnique({
        where: {
          programTaskId_programEnrollmentId: {
            programTaskId: task.id,
            programEnrollmentId: enrollment.id,
          },
        },
        select: progressSelect,
      });
      if (existing?.status === "COMPLETED") {
        throw new ConflictError("A completed task cannot be waived.");
      }
      if (existing?.status === "WAIVED") {
        throw new ConflictError("This task is already waived for the program attempt.");
      }

      const waived = await tx.programTaskProgress.upsert({
        where: {
          programTaskId_programEnrollmentId: {
            programTaskId: task.id,
            programEnrollmentId: enrollment.id,
          },
        },
        create: {
          companyId: context.companyId,
          programTaskId: task.id,
          programEnrollmentId: enrollment.id,
          status: "WAIVED",
          waivedAt: now,
          waivedBy: context.userId,
          waiverReason: input.reason,
        },
        update: {
          status: "WAIVED",
          completedAt: null,
          waivedAt: now,
          waivedBy: context.userId,
          waiverReason: input.reason,
        },
        select: progressSelect,
      });
      await tx.auditLog.create({
        data: {
          companyId: context.companyId,
          actorUserId: context.userId,
          entityType: "PROGRAM_TASK_PROGRESS",
          entityId: String(waived.id),
          action: "WAIVED",
          beforeJson: auditJson(existing),
          afterJson: auditJson(waived),
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    const programProgress = await this.evaluator.reevaluateProgramScoped(
      context,
      params.enrollmentId,
      now,
    );
    return {
      progress: await this.findProgress(context, params),
      programProgress,
    };
  }

  async revoke(
    context: WaiverContext,
    params: ProgramTaskWaiverParams,
    now = new Date(),
  ) {
    await this.prisma.$transaction(async (tx) => {
      const { enrollment, task } = await this.scopedResources(tx, context, params);
      this.assertMutableAttempt(enrollment);

      const existing = await tx.programTaskProgress.findUnique({
        where: {
          programTaskId_programEnrollmentId: {
            programTaskId: task.id,
            programEnrollmentId: enrollment.id,
          },
        },
        select: progressSelect,
      });
      if (!existing || existing.status !== "WAIVED") {
        throw new ConflictError("This task does not have an active waiver for the program attempt.");
      }

      const revoked = await tx.programTaskProgress.update({
        where: { id: existing.id },
        data: {
          status: "NOT_STARTED",
          completedAt: null,
          waivedAt: null,
          waivedBy: null,
          waiverReason: null,
        },
        select: progressSelect,
      });
      await tx.auditLog.create({
        data: {
          companyId: context.companyId,
          actorUserId: context.userId,
          entityType: "PROGRAM_TASK_PROGRESS",
          entityId: String(existing.id),
          action: "WAIVER_REVOKED",
          beforeJson: auditJson(existing),
          afterJson: auditJson(revoked),
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    const programProgress = await this.evaluator.reevaluateProgramScoped(
      context,
      params.enrollmentId,
      now,
    );
    return {
      progress: await this.findProgress(context, params),
      programProgress,
    };
  }

  private async scopedResources(
    tx: Prisma.TransactionClient,
    context: WaiverContext,
    params: ProgramTaskWaiverParams,
  ) {
    const [enrollment, task] = await Promise.all([
      tx.programEnrollment.findFirst({
        where: {
          id: params.enrollmentId,
          companyId: context.companyId,
          programId: params.programId,
          deletedAt: null,
        },
        select: { id: true, enrollmentStatus: true, completion: { select: { id: true } } },
      }),
      tx.programTask.findFirst({
        where: {
          id: params.taskId,
          companyId: context.companyId,
          programId: params.programId,
          deletedAt: null,
        },
        select: { id: true },
      }),
    ]);
    if (!enrollment) throw new NotFoundError("Program enrollment");
    if (!task) throw new NotFoundError("Program task");
    return { enrollment, task };
  }

  private assertMutableAttempt(enrollment: {
    enrollmentStatus: string;
    completion: { id: number } | null;
  }) {
    if (enrollment.completion || enrollment.enrollmentStatus === "COMPLETED") {
      throw new ConflictError(
        "Task waivers cannot change after program completion because completion rewards may already be issued.",
      );
    }
    if (!["PENDING", "ACTIVE"].includes(enrollment.enrollmentStatus)) {
      throw new ConflictError("Task waivers can only change for a pending or active program attempt.");
    }
  }

  private findProgress(context: WaiverContext, params: ProgramTaskWaiverParams) {
    return this.prisma.programTaskProgress.findFirst({
      where: {
        companyId: context.companyId,
        programTaskId: params.taskId,
        programEnrollmentId: params.enrollmentId,
        programTask: { programId: params.programId, deletedAt: null },
        programEnrollment: { programId: params.programId, deletedAt: null },
      },
      select: progressSelect,
    });
  }
}

export const programTaskWaiverService = new ProgramTaskWaiverService(getPrismaClient());
