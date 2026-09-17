import { Prisma, type PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import {
  BusinessRuleError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../common/errors/http-errors.js";
import { getPrismaClient } from "../../config/database.js";
import { enrollmentProgressService } from "../enrollments/enrollment-progress.service.js";
import { notificationDispatcher } from "../notifications/index.js";
import { objectStorageService, type ObjectStorageService } from "../storage/object-storage.service.js";
import type {
  CreateProgramTaskUploadInput,
  PeerReviewInput,
  RejectSubmissionInput,
  ReviewSubmissionInput,
  SubmitProgramTaskInput,
} from "./program-task-submission.dto.js";
import {
  ProgramTaskSubmissionRepository,
  type ProgramTaskSubmissionTransaction,
} from "./program-task-submission.repository.js";

type Context = { companyId: number; userId: number };
type ProgramEvaluator = Pick<typeof enrollmentProgressService, "reevaluateProgram" | "reevaluateProgramScoped">;
type NotificationDispatcher = Pick<typeof notificationDispatcher, "dispatch" | "deliverAfterCommit">;
const auditJson = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

const submissionSelect = {
  id: true,
  programEnrollmentId: true,
  programTaskId: true,
  submissionNo: true,
  submissionType: true,
  status: true,
  textAnswer: true,
  submissionUrl: true,
  dueDate: true,
  submittedAt: true,
  reviewedAt: true,
  reviewedBy: true,
  score: true,
  reviewComment: true,
  completedAt: true,
  files: {
    where: { deletedAt: null },
    select: {
      id: true,
      originalFileName: true,
      mimeType: true,
    },
  },
  peerReviews: {
    select: {
      id: true,
      reviewerEmployeeId: true,
      reviewText: true,
      rating: true,
      reviewedAt: true,
    },
    orderBy: { reviewedAt: "asc" as const },
  },
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

const audit = (
  tx: ProgramTaskSubmissionTransaction,
  context: Context,
  entityId: number,
  action: string,
  before: unknown,
  after: unknown,
) =>
  tx.auditLog.create({
    data: {
      companyId: context.companyId,
      actorUserId: context.userId,
      entityType: "PROGRAM_TASK_SUBMISSION",
      entityId: String(entityId),
      action,
      beforeJson: auditJson(before),
      afterJson: auditJson(after),
    },
  });

export class ProgramTaskSubmissionService {
  constructor(
    private readonly repository: ProgramTaskSubmissionRepository,
    private readonly prisma: PrismaClient,
    private readonly progress: ProgramEvaluator = enrollmentProgressService,
    private readonly storage: ObjectStorageService = objectStorageService,
    private readonly notifier: NotificationDispatcher = notificationDispatcher,
  ) {}

  async listMine(context: Context, programEnrollmentId: number) {
    const enrollment = await this.ownedProgramEnrollment(context, programEnrollmentId);
    const tasks = await this.prisma.programTask.findMany({
      where: {
        companyId: context.companyId,
        programId: enrollment.programId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        description: true,
        displayOrder: true,
        phaseNumber: true,
        dueDate: true,
        dueOffsetDays: true,
        maxSubmissions: true,
        allowResubmission: true,
        isRequired: true,
        isBlocking: true,
        minimumScore: true,
        requiresManagerApproval: true,
        peerReviewRequired: true,
        requiredPeerReviewCount: true,
        courseVersionId: true,
        courseContentId: true,
        assessmentId: true,
        liveSessionId: true,
        surveyId: true,
        taskType: {
          select: { name: true, slug: true, expectedSubmissionType: true, linkedEntity: true },
        },
        progresses: {
          where: { companyId: context.companyId, programEnrollmentId },
          select: {
            status: true,
            completedAt: true,
            waivedAt: true,
            waiverReason: true,
          },
          take: 1,
        },
        submissions: {
          where: { companyId: context.companyId, programEnrollmentId, deletedAt: null },
          select: submissionSelect,
          orderBy: [{ submissionNo: "desc" }, { id: "desc" }],
        },
      },
      orderBy: [{ displayOrder: "asc" }, { id: "asc" }],
    });
    return tasks.map(({ progresses, ...task }) => {
      const phaseNumber = task.phaseNumber ?? 1;
      const isLocked = tasks.some((candidate) => {
        const candidatePhase = candidate.phaseNumber ?? 1;
        const status = candidate.progresses[0]?.status;
        return (
          candidate.isBlocking &&
          candidatePhase < phaseNumber &&
          status !== "COMPLETED" &&
          status !== "WAIVED"
        );
      });
      return {
      ...task,
      progress: progresses[0] ?? null,
      isLocked,
      effectiveDueDate:
        task.dueDate ??
        (task.dueOffsetDays == null
          ? enrollment.dueDate
          : addDays(enrollment.startDate ?? enrollment.enrolledAt, task.dueOffsetDays)),
      };
    });
  }

  async createUpload(
    context: Context,
    programEnrollmentId: number,
    taskId: number,
    input: CreateProgramTaskUploadInput,
  ) {
    this.storage.assertAvailable();
    const enrollment = await this.ownedProgramEnrollment(context, programEnrollmentId);
    if (enrollment.enrollmentStatus !== "ACTIVE") {
      throw new BusinessRuleError("Files can only be uploaded for an active program attempt.");
    }
    const task = await this.prisma.programTask.findFirst({
      where: {
        id: taskId,
        companyId: context.companyId,
        programId: enrollment.programId,
        deletedAt: null,
        taskType: { expectedSubmissionType: "FILE_UPLOAD" },
      },
      select: { id: true, phaseNumber: true },
    });
    if (!task) throw new NotFoundError("File-upload program task");
    const phaseNumber = task.phaseNumber ?? 1;
    const blockers = await this.prisma.programTask.findMany({
      where: {
        companyId: context.companyId,
        programId: enrollment.programId,
        deletedAt: null,
        isBlocking: true,
        OR: phaseNumber > 1
          ? [{ phaseNumber: null }, { phaseNumber: { lt: phaseNumber } }]
          : [{ phaseNumber: { lt: 1 } }],
      },
      select: {
        progresses: {
          where: { companyId: context.companyId, programEnrollmentId },
          select: { status: true },
          take: 1,
        },
      },
    });
    if (blockers.some((blocker) => !["COMPLETED", "WAIVED"].includes(blocker.progresses[0]?.status ?? ""))) {
      throw new BusinessRuleError("Complete or waive the blocking tasks in earlier phases first.");
    }

    const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectKey = `companies/${context.companyId}/program-task-submissions/${randomUUID()}/${safeName}`;
    const extension = safeName.includes(".") ? safeName.split(".").pop()?.toLowerCase() ?? null : null;
    const metadata = this.storage.metadata();
    const file = await this.prisma.storedFile.create({
      data: {
        companyId: context.companyId,
        originalFileName: input.fileName,
        storedFileName: safeName,
        mimeType: input.mimeType,
        fileExtension: extension,
        fileSizeBytes: BigInt(input.fileSizeBytes),
        objectKey,
        uploadedBy: context.userId,
        isActive: false,
        ...metadata,
      },
      select: { id: true, objectKey: true },
    });
    const upload = await this.storage.createUploadUrl({
      objectKey,
      originalFileName: input.fileName,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
    });
    return { fileId: file.id, ...upload };
  }

  async submit(
    context: Context,
    programEnrollmentId: number,
    taskId: number,
    input: SubmitProgramTaskInput,
    now = new Date(),
  ) {
    let verifiedChecksum: string | null = null;
    if (input.submissionType === "FILE_UPLOAD") {
      const file = await this.prisma.storedFile.findFirst({
        where: {
          id: input.fileId,
          companyId: context.companyId,
          uploadedBy: context.userId,
          submissionId: null,
          deletedAt: null,
          isActive: false,
        },
        select: {
          objectKey: true,
          originalFileName: true,
          mimeType: true,
          fileSizeBytes: true,
        },
      });
      if (!file?.objectKey) throw new NotFoundError("Pending task upload");
      const verified = await this.storage.verify({
        objectKey: file.objectKey,
        originalFileName: file.originalFileName,
        mimeType: file.mimeType,
        fileSizeBytes: Number(file.fileSizeBytes),
      });
      verifiedChecksum = verified.checksum;
    }

    const submission = await this.repository.transaction(async (tx) => {
      const enrollment = await this.ownedProgramEnrollmentInTransaction(tx, context, programEnrollmentId);
      if (enrollment.enrollmentStatus !== "ACTIVE") {
        throw new BusinessRuleError("Tasks can only be submitted for an active program enrollment.");
      }
      const task = await tx.programTask.findFirst({
        where: {
          id: taskId,
          companyId: context.companyId,
          programId: enrollment.programId,
          deletedAt: null,
        },
        include: {
          taskType: true,
          program: {
            select: {
              name: true,
              owner: {
                select: {
                  appUsers: {
                    where: { companyId: context.companyId, isActive: true },
                    select: { id: true },
                  },
                },
              },
            },
          },
        },
      });
      if (!task) throw new NotFoundError("Program task");
      const taskProgress = await tx.programTaskProgress.findUnique({
        where: {
          programTaskId_programEnrollmentId: {
            programTaskId: taskId,
            programEnrollmentId,
          },
        },
        select: { status: true },
      });
      if (taskProgress?.status === "WAIVED") {
        throw new BusinessRuleError("A waived task does not accept submissions.");
      }
      const taskPhase = task.phaseNumber ?? 1;
      const blockingPredecessors = await tx.programTask.findMany({
        where: {
          companyId: context.companyId,
          programId: enrollment.programId,
          deletedAt: null,
          isBlocking: true,
          OR: [
            { phaseNumber: null, ...(taskPhase > 1 ? {} : { id: -1 }) },
            { phaseNumber: { lt: taskPhase } },
          ],
        },
        select: {
          id: true,
          progresses: {
            where: { companyId: context.companyId, programEnrollmentId },
            select: { status: true },
            take: 1,
          },
        },
      });
      const locked = blockingPredecessors.some((blocker) => {
        const status = blocker.progresses[0]?.status;
        return status !== "COMPLETED" && status !== "WAIVED";
      });
      if (locked) {
        throw new BusinessRuleError("Complete or waive the blocking tasks in earlier phases first.");
      }
      if (task.taskType.expectedSubmissionType === "QUIZ") {
        throw new BusinessRuleError("Quiz tasks must be completed through an assessment attempt.");
      }
      if (task.taskType.expectedSubmissionType === "NONE") {
        throw new BusinessRuleError("This task does not accept a manual submission.");
      }
      if (task.taskType.expectedSubmissionType !== input.submissionType) {
        throw new BusinessRuleError(
          `This task requires a ${task.taskType.expectedSubmissionType} submission.`,
        );
      }

      const existing = await tx.submission.findMany({
        where: { companyId: context.companyId, programEnrollmentId, programTaskId: taskId, deletedAt: null },
        orderBy: [{ submissionNo: "desc" }, { id: "desc" }],
      });
      const latest = existing[0];
      if (latest) {
        if (!task.allowResubmission) throw new BusinessRuleError("This task does not allow resubmission.");
        if (latest.status !== "REJECTED") {
          throw new BusinessRuleError("A new submission is allowed only after the latest one is rejected.");
        }
      }
      if (task.maxSubmissions != null && existing.length >= task.maxSubmissions) {
        throw new BusinessRuleError("The maximum number of submissions has been reached.");
      }
      const submissionNo = (latest?.submissionNo ?? 0) + 1;
      const dueDate =
        task.dueDate ??
        (task.dueOffsetDays == null
          ? enrollment.dueDate
          : addDays(enrollment.startDate ?? enrollment.enrolledAt, task.dueOffsetDays));
      const needsReview = task.requiresManagerApproval || task.peerReviewRequired;
      const created = await tx.submission.create({
        data: {
          companyId: context.companyId,
          programTaskId: taskId,
          programEnrollmentId,
          employeeId: enrollment.employeeId,
          submissionNo,
          submissionType: input.submissionType,
          status: needsReview ? "UNDER_REVIEW" : "COMPLETED",
          textAnswer: input.submissionType === "TEXT_INPUT" ? input.textAnswer : null,
          submissionUrl: input.submissionType === "LINK" ? input.submissionUrl : null,
          dueDate,
          submittedAt: now,
          completedAt: needsReview ? null : now,
        },
        select: submissionSelect,
      });
      if (input.submissionType === "FILE_UPLOAD") {
        const linked = await tx.storedFile.updateMany({
          where: {
            id: input.fileId,
            companyId: context.companyId,
            uploadedBy: context.userId,
            submissionId: null,
            deletedAt: null,
            isActive: false,
          },
          data: {
            submissionId: created.id,
            checksum: verifiedChecksum,
            isActive: true,
          },
        });
        if (linked.count !== 1) {
          throw new ConflictError("The uploaded file was already used or is no longer available.");
        }
      }
      await audit(tx, context, created.id, "SUBMITTED", null, created);
      const submission = await tx.submission.findUniqueOrThrow({
        where: { id: created.id },
        select: submissionSelect,
      });
      const recipientUserIds = task.program?.owner.appUsers.map((user) => user.id) ?? [];
      const dispatch = recipientUserIds.length === 0 ? null : await this.notifier.dispatch(tx, {
        companyId: context.companyId,
        eventCode: "PROGRAM_TASK_SUBMITTED",
        recipientUserIds,
        entityType: "PROGRAM_TASK_SUBMISSION",
        entityId: String(created.id),
        occurrenceKey: `submitted:${submissionNo}`,
        actionUrl: "/?screen=assignments",
        variables: {
          taskTitle: task.title,
          programTitle: task.program.name,
          learnerName: enrollment.employeeId,
        },
      });
      return { submission, dispatch };
    });
    if (submission.dispatch) await this.notifier.deliverAfterCommit(submission.dispatch);
    const programProgress = await this.progress.reevaluateProgram(context, programEnrollmentId, now);
    return { submission: submission.submission, programProgress };
  }

  async peerReviewQueue(context: Context) {
    const reviewer = await this.prisma.appUser.findFirst({
      where: { id: context.userId, companyId: context.companyId, isActive: true },
      select: { employeeId: true },
    });
    if (!reviewer?.employeeId) throw new ForbiddenError("An employee profile is required for peer review.");
    const memberships = await this.prisma.programEnrollment.findMany({
      where: {
        companyId: context.companyId,
        employeeId: reviewer.employeeId,
        enrollmentStatus: { in: ["ACTIVE", "COMPLETED"] },
        deletedAt: null,
      },
      select: { programId: true },
    });
    const programIds = [...new Set(memberships.map((membership) => membership.programId))];
    if (programIds.length === 0) return [];
    return this.prisma.submission.findMany({
      where: {
        companyId: context.companyId,
        employeeId: { not: reviewer.employeeId },
        deletedAt: null,
        status: { in: ["UNDER_REVIEW", "APPROVED"] },
        programTask: {
          programId: { in: programIds },
          peerReviewRequired: true,
          deletedAt: null,
        },
        peerReviews: { none: { reviewerEmployeeId: reviewer.employeeId } },
      },
      select: {
        ...submissionSelect,
        employee: { select: { id: true, fullName: true } },
        programTask: {
          select: {
            id: true,
            title: true,
            requiredPeerReviewCount: true,
            program: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ submittedAt: "asc" }, { id: "asc" }],
      take: 50,
    });
  }

  async reviewQueue(context: Context) {
    return this.prisma.submission.findMany({
      where: {
        companyId: context.companyId,
        deletedAt: null,
        status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
        programTask: { deletedAt: null, requiresManagerApproval: true },
        programEnrollmentId: { not: null },
      },
      select: {
        ...submissionSelect,
        employee: { select: { id: true, fullName: true } },
        programTask: {
          select: {
            id: true,
            title: true,
            minimumScore: true,
            program: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ submittedAt: "asc" }, { id: "asc" }],
    });
  }

  approve(context: Context, submissionId: number, input: ReviewSubmissionInput, now = new Date()) {
    return this.decide(context, submissionId, "APPROVED", input, now);
  }

  reject(context: Context, submissionId: number, input: RejectSubmissionInput, now = new Date()) {
    return this.decide(context, submissionId, "REJECTED", input, now);
  }

  async peerReview(
    context: Context,
    submissionId: number,
    input: PeerReviewInput,
    now = new Date(),
  ) {
    const outcome = await this.repository.transaction(async (tx) => {
      const reviewer = await tx.appUser.findFirst({
        where: { id: context.userId, companyId: context.companyId, isActive: true },
        select: { employeeId: true },
      });
      if (!reviewer?.employeeId) throw new ForbiddenError("An employee profile is required for peer review.");
      const submission = await tx.submission.findFirst({
        where: { id: submissionId, companyId: context.companyId, deletedAt: null },
        include: { programTask: true, peerReviews: { select: { id: true } } },
      });
      if (!submission?.programTask || !submission.programEnrollmentId) {
        throw new NotFoundError("Program task submission");
      }
      const taskProgress = await tx.programTaskProgress.findUnique({
        where: {
          programTaskId_programEnrollmentId: {
            programTaskId: submission.programTask.id,
            programEnrollmentId: submission.programEnrollmentId,
          },
        },
        select: { status: true },
      });
      if (taskProgress?.status === "WAIVED") {
        throw new BusinessRuleError("A waived task is closed to peer review.");
      }
      if (!submission.programTask.peerReviewRequired) {
        throw new BusinessRuleError("This task does not use peer review.");
      }
      if (!["UNDER_REVIEW", "APPROVED"].includes(submission.status)) {
        throw new BusinessRuleError("This submission is not open for peer review.");
      }
      if (submission.employeeId === reviewer.employeeId) {
        throw new ForbiddenError("Learners cannot peer-review their own submission.");
      }
      const eligible = await tx.programEnrollment.findFirst({
        where: {
          companyId: context.companyId,
          employeeId: reviewer.employeeId,
          programId: submission.programTask.programId,
          enrollmentStatus: { in: ["ACTIVE", "COMPLETED"] },
          deletedAt: null,
        },
        select: { id: true },
      });
      if (!eligible) throw new ForbiddenError("Only learners in the same program may peer-review this submission.");

      const review = await tx.submissionPeerReview.create({
        data: {
          companyId: context.companyId,
          submissionId,
          reviewerEmployeeId: reviewer.employeeId,
          reviewText: input.reviewText,
          rating: input.rating,
          reviewedAt: now,
        },
      });
      const reviewCount = submission.peerReviews.length + 1;
      const required = submission.programTask.requiredPeerReviewCount ?? 3;
      let status = submission.status;
      if (
        reviewCount >= required &&
        !submission.programTask.requiresManagerApproval &&
        submission.status === "UNDER_REVIEW"
      ) {
        status = "COMPLETED";
        await tx.submission.update({
          where: { id: submissionId },
          data: { status, completedAt: now },
        });
      }
      await audit(tx, context, submissionId, "PEER_REVIEWED", null, { review, status });
      return { review, status, programEnrollmentId: submission.programEnrollmentId };
    });
    const programProgress = await this.progress.reevaluateProgramScoped(
      context,
      outcome.programEnrollmentId,
      now,
    );
    return { ...outcome, programProgress };
  }

  private async decide(
    context: Context,
    submissionId: number,
    status: "APPROVED" | "REJECTED",
    input: ReviewSubmissionInput | RejectSubmissionInput,
    now: Date,
  ) {
    const outcome = await this.repository.transaction(async (tx) => {
      const reviewer = await tx.appUser.findFirst({
        where: { id: context.userId, companyId: context.companyId, isActive: true },
        select: { employeeId: true },
      });
      const submission = await tx.submission.findFirst({
        where: { id: submissionId, companyId: context.companyId, deletedAt: null },
        include: {
          programTask: { include: { program: { select: { name: true } } } },
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
      if (!submission?.programTask || !submission.programEnrollmentId) {
        throw new NotFoundError("Program task submission");
      }
      const taskProgress = await tx.programTaskProgress.findUnique({
        where: {
          programTaskId_programEnrollmentId: {
            programTaskId: submission.programTask.id,
            programEnrollmentId: submission.programEnrollmentId,
          },
        },
        select: { status: true },
      });
      if (taskProgress?.status === "WAIVED") {
        throw new BusinessRuleError("A waived task is closed to reviewer decisions.");
      }
      if (!submission.programTask.requiresManagerApproval) {
        throw new BusinessRuleError("This task does not require reviewer approval.");
      }
      if (reviewer?.employeeId && reviewer.employeeId === submission.employeeId) {
        throw new ForbiddenError("Reviewers cannot decide their own submission.");
      }
      const before = {
        status: submission.status,
        score: submission.score,
        reviewComment: submission.reviewComment,
      };
      const score = "score" in input ? input.score : undefined;
      const updated = await tx.submission.updateMany({
        where: {
          id: submissionId,
          companyId: context.companyId,
          status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
          deletedAt: null,
        },
        data: {
          status,
          score,
          reviewComment: input.reviewComment,
          reviewedAt: now,
          reviewedBy: context.userId,
          completedAt: status === "APPROVED" ? now : null,
        },
      });
      if (updated.count === 0) throw new ConflictError("Submission was already reviewed.");
      const decided = await tx.submission.findUniqueOrThrow({
        where: { id: submissionId },
        select: submissionSelect,
      });
      await audit(tx, context, submissionId, status, before, decided);
      const recipientUserIds = submission.employee.appUsers.map((user) => user.id);
      const dispatch = recipientUserIds.length === 0 ? null : await this.notifier.dispatch(tx, {
        companyId: context.companyId,
        eventCode: status === "APPROVED" ? "PROGRAM_TASK_APPROVED" : "PROGRAM_TASK_REJECTED",
        recipientUserIds,
        entityType: "PROGRAM_TASK_SUBMISSION",
        entityId: String(submissionId),
        occurrenceKey: status.toLowerCase(),
        actionUrl: `/?screen=my-programs&programEnrollmentId=${submission.programEnrollmentId}`,
        variables: {
          taskTitle: submission.programTask.title,
          programTitle: submission.programTask.program.name,
          reviewerNote: input.reviewComment ? ` Reviewer note: ${input.reviewComment}` : "",
        },
      });
      return { submission: decided, programEnrollmentId: submission.programEnrollmentId, dispatch };
    });
    if (outcome.dispatch) await this.notifier.deliverAfterCommit(outcome.dispatch);
    const programProgress = await this.progress.reevaluateProgramScoped(
      context,
      outcome.programEnrollmentId,
      now,
    );
    return { submission: outcome.submission, programProgress };
  }

  private async ownedProgramEnrollment(context: Context, programEnrollmentId: number) {
    const enrollment = await this.prisma.programEnrollment.findFirst({
      where: {
        id: programEnrollmentId,
        companyId: context.companyId,
        deletedAt: null,
        employee: {
          appUsers: { some: { id: context.userId, companyId: context.companyId, isActive: true } },
        },
      },
      select: {
        id: true,
        programId: true,
        employeeId: true,
        enrollmentStatus: true,
        enrolledAt: true,
        startDate: true,
        dueDate: true,
      },
    });
    if (!enrollment) throw new NotFoundError("Program enrollment");
    return enrollment;
  }

  private async ownedProgramEnrollmentInTransaction(
    tx: ProgramTaskSubmissionTransaction,
    context: Context,
    programEnrollmentId: number,
  ) {
    const enrollment = await tx.programEnrollment.findFirst({
      where: {
        id: programEnrollmentId,
        companyId: context.companyId,
        deletedAt: null,
        employee: {
          appUsers: { some: { id: context.userId, companyId: context.companyId, isActive: true } },
        },
      },
      select: {
        id: true,
        programId: true,
        employeeId: true,
        enrollmentStatus: true,
        enrolledAt: true,
        startDate: true,
        dueDate: true,
      },
    });
    if (!enrollment) throw new NotFoundError("Program enrollment");
    return enrollment;
  }
}

const prisma = getPrismaClient();
export const programTaskSubmissionService = new ProgramTaskSubmissionService(
  new ProgramTaskSubmissionRepository(prisma),
  prisma,
);
