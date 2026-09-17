import { Prisma } from "@prisma/client";
import { getPrismaClient } from "../../config/database.js";
import {
  BusinessRuleError,
  ForbiddenError,
  NotFoundError,
} from "../../common/errors/http-errors.js";
import { notificationDispatcher } from "../notifications/index.js";
import { completionRewardsService } from "./completion-rewards.service.js";
import type {
  EndLearningSessionInput,
  StartLearningSessionInput,
  UpdateContentProgressInput,
} from "./enrollment-progress.dto.js";
import {
  EnrollmentProgressRepository,
  type EnrollmentProgressTransaction,
} from "./enrollment-progress.repository.js";

type ProgressContext = { companyId: number; userId: number };
type DispatchResult = Awaited<ReturnType<typeof notificationDispatcher.dispatch>>;
type Notifier = {
  dispatch: typeof notificationDispatcher.dispatch;
  deliverAfterCommit: typeof notificationDispatcher.deliverAfterCommit;
};
type RewardProcessor = Pick<typeof completionRewardsService, "processIds">;

const json = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const numberOf = (value: Prisma.Decimal | number | null | undefined) =>
  value == null ? null : Number(value);
const percentage = (done: number, total: number) =>
  total === 0 ? 0 : Number(((done / total) * 100).toFixed(2));

type GradedAttempt = {
  id: number;
  attemptNo: number;
  percentage: Prisma.Decimal | number | null;
};

export const aggregateAssessmentAttempts = (
  method: string,
  attempts: GradedAttempt[],
) => {
  const populated = attempts
    .filter((attempt) => attempt.percentage != null)
    .sort((left, right) => left.attemptNo - right.attemptNo);
  if (populated.length === 0) {
    return { score: null as number | null, representative: null as GradedAttempt | null, attemptIds: [] as number[] };
  }
  if (method === "first_attempt") {
    return { score: Number(populated[0].percentage), representative: populated[0], attemptIds: [populated[0].id] };
  }
  if (method === "latest_attempt") {
    const latest = populated[populated.length - 1];
    return { score: Number(latest.percentage), representative: latest, attemptIds: [latest.id] };
  }
  if (method === "average_score") {
    const score = Number((populated.reduce((sum, attempt) => sum + Number(attempt.percentage), 0) / populated.length).toFixed(2));
    return { score, representative: null, attemptIds: populated.map((attempt) => attempt.id) };
  }
  const highest = [...populated].sort((left, right) =>
    Number(right.percentage) - Number(left.percentage) || left.attemptNo - right.attemptNo,
  )[0];
  return { score: Number(highest.percentage), representative: highest, attemptIds: [highest.id] };
};

const enrollmentScope = async (
  tx: EnrollmentProgressTransaction,
  context: ProgressContext,
  enrollmentId: number,
) => {
  const enrollment = await tx.enrollment.findFirst({
    where: { id: enrollmentId, companyId: context.companyId, deletedAt: null },
    include: {
      employee: {
        select: {
          id: true,
          appUsers: {
            where: { id: context.userId, companyId: context.companyId },
            select: { id: true },
          },
        },
      },
      courseVersion: {
        select: {
          id: true,
          companyId: true,
          status: true,
          completionThreshold: true,
          requiredAssessmentScore: true,
          attendanceRequired: true,
          minimumAttendance: true,
          course: { select: { id: true, title: true } },
        },
      },
    },
  });
  if (!enrollment) throw new NotFoundError("Enrollment");
  if (enrollment.employee.appUsers.length === 0) {
    throw new ForbiddenError("Enrollment does not belong to the current learner.");
  }
  return enrollment;
};

const acceptedSubmission = (submission: {
  status: string;
  score: Prisma.Decimal | null;
  peerReviews: { id: number }[];
}) => submission.status === "APPROVED" || submission.status === "COMPLETED";

export class EnrollmentProgressService {
  constructor(
    private readonly repository: EnrollmentProgressRepository,
    private readonly notifier: Notifier = notificationDispatcher,
    private readonly rewards: RewardProcessor = completionRewardsService,
  ) { }

  listMine(context: ProgressContext) {
    return this.repository.listOwnedEnrollments(context.companyId, context.userId);
  }

  listMyPrograms(context: ProgressContext) {
    return this.repository.listOwnedPrograms(context.companyId, context.userId);
  }

  async getProgress(context: ProgressContext, enrollmentId: number) {
    const enrollment = await this.repository.findOwnedEnrollment(
      context.companyId,
      context.userId,
      enrollmentId,
    );
    if (!enrollment) throw new NotFoundError("Enrollment");
    return enrollment;
  }

  async updateContent(
    context: ProgressContext,
    enrollmentId: number,
    contentId: number,
    input: UpdateContentProgressInput,
    now = new Date(),
  ) {
    const result = await this.repository.transaction(async (tx) => {
      const enrollment = await enrollmentScope(tx, context, enrollmentId);
      if (!["ACTIVE", "COMPLETED"].includes(enrollment.status)) {
        throw new BusinessRuleError("Progress can only be recorded for an active enrollment.");
      }
      if (enrollment.status === "COMPLETED") {
        throw new BusinessRuleError("A completed enrollment cannot be changed.");
      }

      const content = await tx.courseContent.findFirst({
        where: {
          id: contentId,
          companyId: context.companyId,
          deletedAt: null,
          chapter: {
            companyId: context.companyId,
            courseVersionId: enrollment.courseVersionId,
            status: "PUBLISHED",
            deletedAt: null,
          },
        },
        select: { id: true, completionThreshold: true, minimumTimeMinutes: true },
      });
      if (!content) throw new NotFoundError("Published course content");

      const progress = await tx.learningProgress.upsert({
        where: { enrollmentId },
        create: {
          companyId: context.companyId,
          enrollmentId,
          overallProgress: 0,
          completedLessons: 0,
          totalLessons: 0,
          completedAssessments: 0,
          totalAssessments: 0,
          totalLearningMinutes: 0,
          lastAccessedAt: now,
          lastContentId: contentId,
        },
        update: { lastAccessedAt: now, lastContentId: contentId },
        select: { id: true },
      });
      const existing = await tx.lessonProgress.findUnique({
        where: { learningProgressId_contentId: { learningProgressId: progress.id, contentId } },
      });
      const watchPercentage = input.watchPercentage ?? numberOf(existing?.watchPercentage);
      const timeSpentMinutes = input.timeSpentMinutes ?? existing?.timeSpentMinutes ?? 0;
      if (input.status === "COMPLETED") {
        const watchThreshold = numberOf(content.completionThreshold);
        if (watchThreshold != null && (watchPercentage ?? 0) < watchThreshold) {
          throw new BusinessRuleError(
            `Content requires at least ${watchThreshold}% watched before completion.`,
          );
        }
        if (content.minimumTimeMinutes != null && timeSpentMinutes < content.minimumTimeMinutes) {
          throw new BusinessRuleError(
            `Content requires at least ${content.minimumTimeMinutes} learning minutes before completion.`,
          );
        }
      }

      const startedAt =
        input.status === "NOT_STARTED" ? existing?.startedAt ?? null : existing?.startedAt ?? now;
      const completedAt =
        input.status === "COMPLETED" ? existing?.completedAt ?? now : null;
      await tx.lessonProgress.upsert({
        where: { learningProgressId_contentId: { learningProgressId: progress.id, contentId } },
        create: {
          companyId: context.companyId,
          learningProgressId: progress.id,
          contentId,
          status: input.status,
          watchPercentage: input.watchPercentage,
          lastPositionSeconds: input.lastPositionSeconds,
          timeSpentMinutes,
          startedAt,
          completedAt,
        },
        update: {
          status: input.status,
          watchPercentage: input.watchPercentage,
          lastPositionSeconds: input.lastPositionSeconds,
          timeSpentMinutes: input.timeSpentMinutes,
          startedAt,
          completedAt,
        },
      });

      if (!enrollment.startedAt && input.status !== "NOT_STARTED") {
        await tx.enrollment.update({ where: { id: enrollmentId }, data: { startedAt: now } });
      }
      return this.evaluateCourseInTransaction(tx, context, enrollmentId, now);
    });
    await Promise.all(result.dispatches.map((item) => this.notifier.deliverAfterCommit(item)));
    await this.rewards.processIds(result.outboxIds);
    return result.value;
  }

  async reevaluate(context: ProgressContext, enrollmentId: number, now = new Date()) {
    await this.repository.transaction((tx) => enrollmentScope(tx, context, enrollmentId));
    return this.reevaluateScoped(context, enrollmentId, now);
  }

  async reevaluateScoped(context: ProgressContext, enrollmentId: number, now = new Date()) {
    const result = await this.repository.transaction(async (tx) => {
      const scoped = await tx.enrollment.findFirst({
        where: { id: enrollmentId, companyId: context.companyId, deletedAt: null },
        select: { id: true },
      });
      if (!scoped) throw new NotFoundError("Enrollment");
      return this.evaluateCourseInTransaction(tx, context, enrollmentId, now);
    });
    await Promise.all(result.dispatches.map((item) => this.notifier.deliverAfterCommit(item)));
    await this.rewards.processIds(result.outboxIds);
    return result.value;
  }

  async reevaluateProgram(
    context: ProgressContext,
    programEnrollmentId: number,
    now = new Date(),
  ) {
    const owned = await this.repository.transaction((tx) =>
      tx.programEnrollment.findFirst({
        where: {
          id: programEnrollmentId,
          companyId: context.companyId,
          deletedAt: null,
          employee: { appUsers: { some: { id: context.userId, companyId: context.companyId } } },
        },
        select: { id: true },
      }),
    );
    if (!owned) throw new NotFoundError("Program enrollment");
    return this.reevaluateProgramScoped(context, programEnrollmentId, now);
  }

  async reevaluateProgramScoped(
    context: ProgressContext,
    programEnrollmentId: number,
    now = new Date(),
  ) {
    const result = await this.repository.transaction(async (tx) => {
      const scoped = await tx.programEnrollment.findFirst({
        where: { id: programEnrollmentId, companyId: context.companyId, deletedAt: null },
        select: { id: true },
      });
      if (!scoped) throw new NotFoundError("Program enrollment");
      return this.evaluateProgramInTransaction(tx, context, programEnrollmentId, now);
    });
    await Promise.all(result.dispatches.map((item) => this.notifier.deliverAfterCommit(item)));
    await this.rewards.processIds(result.outboxIds);
    return result.value;
  }

  async startSession(
    context: ProgressContext,
    enrollmentId: number,
    input: StartLearningSessionInput,
    metadata: { ipAddress?: string },
    now = new Date(),
  ) {
    return this.repository.transaction(async (tx) => {
      const enrollment = await enrollmentScope(tx, context, enrollmentId);
      if (enrollment.status !== "ACTIVE") {
        throw new BusinessRuleError("A learning session requires an active enrollment.");
      }
      return tx.learningSession.create({
        data: {
          companyId: context.companyId,
          enrollmentId,
          sessionStart: now,
          deviceType: input.deviceType,
          ipAddress: metadata.ipAddress,
          isActive: true,
        },
      });
    });
  }

  async endSession(
    context: ProgressContext,
    sessionId: number,
    input: EndLearningSessionInput,
    now = new Date(),
  ) {
    return this.repository.transaction(async (tx) => {
      const session = await tx.learningSession.findFirst({
        where: {
          id: sessionId,
          companyId: context.companyId,
          enrollment: {
            companyId: context.companyId,
            deletedAt: null,
            employee: { appUsers: { some: { id: context.userId, companyId: context.companyId } } },
          },
        },
      });
      if (!session) throw new NotFoundError("Learning session");
      if (!session.isActive) return session;
      const elapsed = Math.max(0, Math.floor((now.getTime() - session.sessionStart.getTime()) / 1000));
      const totalSeconds = input.totalSeconds == null ? elapsed : Math.min(input.totalSeconds, elapsed + 60);
      return tx.learningSession.update({
        where: { id: session.id },
        data: { sessionEnd: now, totalSeconds, isActive: false },
      });
    });
  }

  private async evaluateCourseInTransaction(
    tx: EnrollmentProgressTransaction,
    context: ProgressContext,
    enrollmentId: number,
    now: Date,
  ): Promise<{ value: unknown; dispatches: DispatchResult[]; outboxIds: number[] }> {
    const enrollment = await tx.enrollment.findFirstOrThrow({
      where: { id: enrollmentId, companyId: context.companyId, deletedAt: null },
      include: {
        employee: { select: { id: true, appUsers: { select: { id: true } } } },
        courseVersion: {
          select: {
            id: true,
            status: true,
            completionThreshold: true,
            requiredAssessmentScore: true,
            attendanceRequired: true,
            minimumAttendance: true,
            course: { select: { id: true, title: true } },
          },
        },
        completion: true,
      },
    });

    const contents = await tx.courseContent.findMany({
      where: {
        companyId: context.companyId,
        deletedAt: null,
        isRequired: true,
        chapter: {
          companyId: context.companyId,
          courseVersionId: enrollment.courseVersionId,
          status: "PUBLISHED",
          isRequired: true,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        completionThreshold: true,
        minimumTimeMinutes: true,
        lessonProgress: {
          where: { learningProgress: { enrollmentId } },
          select: {
            id: true,
            status: true,
            watchPercentage: true,
            timeSpentMinutes: true,
          },
          take: 1,
        },
      },
      orderBy: [{ chapter: { displayOrder: "asc" } }, { displayOrder: "asc" }],
    });
    const completedContents = contents.filter((content) => {
      const progress = content.lessonProgress[0];
      if (!progress || progress.status !== "COMPLETED") return false;
      const watchThreshold = numberOf(content.completionThreshold);
      if (watchThreshold != null && Number(progress.watchPercentage ?? 0) < watchThreshold) return false;
      if (
        content.minimumTimeMinutes != null &&
        progress.timeSpentMinutes < content.minimumTimeMinutes
      ) return false;
      return true;
    });

    const assessments = await tx.assessment.findMany({
      where: {
        companyId: context.companyId,
        courseVersionId: enrollment.courseVersionId,
        status: "PUBLISHED",
        deletedAt: null,
        assessmentType: { isActive: true, isPractice: false, isGraded: true, isScored: true },
      },
      select: {
        id: true,
        passingScore: true,
        gradingMethod: { select: { slug: true } },
        attempts: {
          where: { enrollmentId, companyId: context.companyId, status: "GRADED", deletedAt: null },
          select: { id: true, attemptNo: true, percentage: true },
          orderBy: { attemptNo: "asc" },
        },
      },
      orderBy: { id: "asc" },
    });
    const selectedAttempts = assessments.map((assessment) => {
      const aggregate = aggregateAssessmentAttempts(
        assessment.gradingMethod.slug,
        assessment.attempts,
      );
      return {
        assessment,
        ...aggregate,
        passed:
          aggregate.score != null &&
          aggregate.score >= Number(assessment.passingScore),
      };
    });
    const completedAssessments = selectedAttempts.filter(({ passed }) => passed);
    const assessmentScore =
      completedAssessments.length === 0
        ? 0
        : Number(
          (
            completedAssessments.reduce(
              (sum, { score }) => sum + Number(score),
              0,
            ) / completedAssessments.length
          ).toFixed(2),
        );

    const requiredSessions = enrollment.courseVersion.attendanceRequired
      ? await tx.liveSession.findMany({
        where: {
          companyId: context.companyId,
          courseVersionId: enrollment.courseVersionId,
          attendanceRequired: true,
          status: "COMPLETED",
          deletedAt: null,
        },
        select: {
          id: true,
          attendees: {
            where: { enrollmentId, companyId: context.companyId, deletedAt: null },
            select: { id: true, attendanceStatus: true, attendancePercentage: true },
            take: 1,
          },
        },
        orderBy: { id: "asc" },
      })
      : [];
    const attendanceValues = requiredSessions.map((session) => {
      const record = session.attendees[0];
      if (!record) return null;
      if (record.attendancePercentage != null) return Number(record.attendancePercentage);
      if (record.attendanceStatus === "PRESENT") return 100;
      if (["ABSENT", "NO_SHOW"].includes(record.attendanceStatus)) return 0;
      return null;
    });
    const attendancePercentage =
      attendanceValues.length > 0 && attendanceValues.every((value) => value != null)
        ? Number(
          (attendanceValues.reduce<number>((sum, value) => sum + Number(value), 0) /
            attendanceValues.length).toFixed(2),
        )
        : null;

    const contentPercentage = percentage(completedContents.length, contents.length);
    const contentThreshold = Number(enrollment.courseVersion.completionThreshold);
    const contentGate = contents.length === 0 || contentPercentage >= contentThreshold;
    const requiredAssessmentScore = Number(enrollment.courseVersion.requiredAssessmentScore);
    const assessmentGate =
      assessments.length === 0
        ? requiredAssessmentScore <= 0
        : completedAssessments.length === assessments.length &&
        assessmentScore >= requiredAssessmentScore;
    const minimumAttendance = Number(enrollment.courseVersion.minimumAttendance ?? 100);
    const attendanceGate =
      !enrollment.courseVersion.attendanceRequired ||
      (requiredSessions.length > 0 &&
        attendancePercentage != null &&
        attendancePercentage >= minimumAttendance);
    const hasRequirements = contents.length + assessments.length + requiredSessions.length > 0;
    const eligible =
      enrollment.courseVersion.status === "PUBLISHED" &&
      hasRequirements &&
      contentGate &&
      assessmentGate &&
      attendanceGate;

    const totalLearningMinutes = contents.reduce(
      (sum, content) => sum + (content.lessonProgress[0]?.timeSpentMinutes ?? 0),
      0,
    );
    const overallProgress = percentage(
      completedContents.length + completedAssessments.length,
      contents.length + assessments.length,
    );
    const learningProgress = await tx.learningProgress.upsert({
      where: { enrollmentId },
      create: {
        companyId: context.companyId,
        enrollmentId,
        overallProgress: eligible ? 100 : overallProgress,
        completedLessons: completedContents.length,
        totalLessons: contents.length,
        completedAssessments: completedAssessments.length,
        totalAssessments: assessments.length,
        totalLearningMinutes,
        lastAccessedAt: now,
      },
      update: {
        overallProgress: eligible ? 100 : overallProgress,
        completedLessons: completedContents.length,
        totalLessons: contents.length,
        completedAssessments: completedAssessments.length,
        totalAssessments: assessments.length,
        totalLearningMinutes,
        lastAccessedAt: now,
      },
    });

    const evaluation = {
      evaluatorVersion: 1,
      evaluatedAt: now,
      eligible,
      reasons: [
        ...(enrollment.courseVersion.status !== "PUBLISHED" ? ["COURSE_VERSION_NOT_PUBLISHED"] : []),
        ...(!hasRequirements ? ["NO_COMPLETION_REQUIREMENTS"] : []),
        ...(!contentGate ? ["CONTENT_THRESHOLD_NOT_MET"] : []),
        ...(!assessmentGate ? ["ASSESSMENTS_NOT_PASSED"] : []),
        ...(!attendanceGate ? ["ATTENDANCE_NOT_MET"] : []),
      ],
      content: {
        threshold: contentThreshold,
        requiredIds: contents.map((content) => content.id),
        completedIds: completedContents.map((content) => content.id),
        percentage: contentPercentage,
      },
      assessments: {
        requiredScore: requiredAssessmentScore,
        requiredIds: assessments.map((assessment) => assessment.id),
        completed: completedAssessments.map(({ assessment, representative, attemptIds, score }) => ({
          assessmentId: assessment.id,
          aggregationMethod: assessment.gradingMethod.slug,
          attemptIds,
          attemptId: representative?.id ?? null,
          attemptNo: representative?.attemptNo ?? null,
          percentage: score,
        })),
        score: assessmentScore,
      },
      attendance: {
        required: enrollment.courseVersion.attendanceRequired,
        minimum: minimumAttendance,
        percentage: attendancePercentage,
        sessionIds: requiredSessions.map((session) => session.id),
        attendanceIds: requiredSessions.flatMap((session) =>
          session.attendees.map((record) => record.id),
        ),
      },
    };

    const dispatches: DispatchResult[] = [];
    const outboxIds: number[] = [];
    let completion = enrollment.completion;
    let programResults: unknown[] = [];
    if (eligible && !completion) {
      completion = await tx.courseCompletion.create({
        data: {
          companyId: context.companyId,
          enrollmentId,
          finalScore: assessments.length === 0 ? 100 : assessmentScore,
          passed: true,
          completedAt: now,
          completionSnapshot: json(evaluation),
        },
      });
      const previousStatus = enrollment.status;
      await tx.enrollment.update({
        where: { id: enrollmentId },
        data: { status: "COMPLETED", completedAt: now },
      });
      await tx.enrollmentActivityLog.create({
        data: {
          companyId: context.companyId,
          enrollmentId,
          activityType: "COURSE_COMPLETED",
          previousStatus,
          currentStatus: "COMPLETED",
          performedBy: null,
          metadata: { evaluatorVersion: 1, completionId: completion.id },
        },
      });
      await tx.auditLog.create({
        data: {
          companyId: context.companyId,
          actorUserId: context.userId,
          entityType: "COURSE_COMPLETION",
          entityId: String(completion.id),
          action: "AUTOMATICALLY_COMPLETED",
          afterJson: json(evaluation),
        },
      });
      const outbox = await tx.completionOutbox.create({
        data: {
          companyId: context.companyId,
          eventKey: `course-completion:${completion.id}`,
          eventType: "COURSE_COMPLETED",
          courseCompletionId: completion.id,
        },
        select: { id: true },
      });
      outboxIds.push(outbox.id);
      dispatches.push(
        await this.notifier.dispatch(tx, {
          companyId: context.companyId,
          eventCode: "COURSE_COMPLETED",
          recipientUserIds: enrollment.employee.appUsers.map((user) => user.id),
          entityType: "COURSE_COMPLETION",
          entityId: String(completion.id),
          occurrenceKey: "completed",
          actionUrl: `/?screen=my-courses&courseId=${enrollment.courseVersion.course.id}`,
          variables: { courseTitle: enrollment.courseVersion.course.title },
        }),
      );
    }
    if (enrollment.programEnrollmentId) {
      const programResult = await this.evaluateProgramInTransaction(
        tx,
        context,
        enrollment.programEnrollmentId,
        now,
      );
      programResults = [programResult.value];
      dispatches.push(...programResult.dispatches);
      outboxIds.push(...programResult.outboxIds);
    }

    return {
      value: { enrollmentId, progress: learningProgress, evaluation, completion, programResults },
      dispatches,
      outboxIds,
    };
  }

  private async evaluateProgramInTransaction(
    tx: EnrollmentProgressTransaction,
    context: ProgressContext,
    programEnrollmentId: number,
    now: Date,
  ): Promise<{ value: unknown; dispatches: DispatchResult[]; outboxIds: number[] }> {
    const programEnrollment = await tx.programEnrollment.findFirstOrThrow({
      where: { id: programEnrollmentId, companyId: context.companyId, deletedAt: null },
      include: {
        employee: { select: { id: true, appUsers: { select: { id: true } } } },
        program: { select: { id: true, name: true } },
        completion: true,
      },
    });
    const courses = await tx.programCourse.findMany({
      where: { companyId: context.companyId, programId: programEnrollment.programId, isRequired: true },
      select: { id: true, courseVersionId: true, phaseNumber: true },
      orderBy: { displayOrder: "asc" },
    });
    const courseResults = await Promise.all(
      courses.map(async (course) => {
        const linked = await tx.enrollment.findFirst({
          where: {
            companyId: context.companyId,
            programEnrollmentId,
            courseVersionId: course.courseVersionId,
            deletedAt: null,
          },
          select: {
            id: true,
            status: true,
            completion: { select: { id: true, passed: true } },
          },
        });
        return {
          ...course,
          satisfied: linked?.completion?.passed === true,
          enrollmentId: linked?.id,
          enrollmentStatus: linked?.status,
          completionId: linked?.completion?.id,
        };
      }),
    );

    const tasks = await tx.programTask.findMany({
      where: {
        companyId: context.companyId,
        programId: programEnrollment.programId,
        deletedAt: null,
        OR: [{ isRequired: true }, { isBlocking: true }],
      },
      include: { taskType: true },
      orderBy: { displayOrder: "asc" },
    });
    const taskResults = [];
    for (const task of tasks) {
      const existingTaskProgress = await tx.programTaskProgress.findUnique({
        where: {
          programTaskId_programEnrollmentId: {
            programTaskId: task.id,
            programEnrollmentId,
          },
        },
        select: {
          id: true,
          status: true,
          completedAt: true,
          waivedAt: true,
          waivedBy: true,
          waiverReason: true,
        },
      });
      const submissions = await tx.submission.findMany({
        where: {
          companyId: context.companyId,
          programTaskId: task.id,
          programEnrollmentId,
          employeeId: programEnrollment.employeeId,
          deletedAt: null,
        },
        include: { peerReviews: { select: { id: true } } },
        orderBy: [{ submissionNo: "desc" }, { id: "desc" }],
      });
      const submission = submissions.find(acceptedSubmission);
      let linkedSatisfied = false;
      let linkedScore: number | null = submission?.score == null ? null : Number(submission.score);
      let linkedAttendance: number | null = null;

      if (task.taskType.linkedEntity === "NONE") linkedSatisfied = Boolean(submission);
      if (task.taskType.linkedEntity === "COURSE_VERSION" && task.courseVersionId) {
        linkedSatisfied = courseResults.some(
          (course) => course.courseVersionId === task.courseVersionId && course.satisfied,
        ) || Boolean(await tx.enrollment.findFirst({
          where: {
            companyId: context.companyId,
            programEnrollmentId,
            courseVersionId: task.courseVersionId,
            deletedAt: null,
            completion: { passed: true },
          },
          select: { id: true },
        }));
      }
      if (task.taskType.linkedEntity === "COURSE_CONTENT" && task.courseContentId) {
        const progress = await tx.lessonProgress.findFirst({
          where: {
            companyId: context.companyId,
            contentId: task.courseContentId,
            status: "COMPLETED",
            learningProgress: {
              enrollment: { programEnrollmentId, companyId: context.companyId, deletedAt: null },
            },
          },
          select: { timeSpentMinutes: true },
        });
        linkedSatisfied = Boolean(progress) &&
          (task.minimumTimeMinutes == null || progress!.timeSpentMinutes >= task.minimumTimeMinutes);
      }
      if (task.taskType.linkedEntity === "ASSESSMENT" && task.assessmentId) {
        const assessment = await tx.assessment.findFirst({
          where: {
            id: task.assessmentId,
            companyId: context.companyId,
            deletedAt: null,
          },
          select: {
            passingScore: true,
            gradingMethod: { select: { slug: true } },
            attempts: {
              where: {
                companyId: context.companyId,
                status: "GRADED",
                deletedAt: null,
                enrollment: { programEnrollmentId, companyId: context.companyId, deletedAt: null },
              },
              select: { id: true, attemptNo: true, percentage: true },
              orderBy: { attemptNo: "asc" },
            },
          },
        });
        const aggregate = assessment
          ? aggregateAssessmentAttempts(assessment.gradingMethod.slug, assessment.attempts)
          : null;
        linkedScore = aggregate?.score ?? null;
        linkedSatisfied =
          linkedScore != null &&
          linkedScore >= Number(assessment?.passingScore ?? 0);
      }
      if (task.taskType.linkedEntity === "LIVE_SESSION" && task.liveSessionId) {
        const attendance = await tx.liveSessionAttendance.findFirst({
          where: {
            companyId: context.companyId,
            sessionId: task.liveSessionId,
            deletedAt: null,
            session: { status: "COMPLETED", deletedAt: null },
            enrollment: { programEnrollmentId, companyId: context.companyId, deletedAt: null },
          },
          select: { attendanceStatus: true, attendancePercentage: true },
        });
        linkedAttendance = attendance?.attendancePercentage == null
          ? attendance?.attendanceStatus === "PRESENT" ? 100 : null
          : Number(attendance.attendancePercentage);
        linkedSatisfied = linkedAttendance != null && linkedAttendance > 0;
      }
      if (task.taskType.linkedEntity === "SURVEY" && task.surveyId) {
        linkedSatisfied = Boolean(await tx.surveyResponse.findFirst({
          where: {
            companyId: context.companyId,
            surveyId: task.surveyId,
            programEnrollmentId,
          },
          select: { id: true },
        }));
      }

      const submissionRequired = task.taskType.expectedSubmissionType !== "NONE";
      const approvalsSatisfied =
        !task.requiresManagerApproval || submission?.status === "APPROVED";
      const peerReviewsSatisfied =
        !task.peerReviewRequired ||
        (submission?.peerReviews.length ?? 0) >= (task.requiredPeerReviewCount ?? 3);
      const scoreSatisfied =
        task.minimumScore == null ||
        (linkedScore != null && linkedScore >= Number(task.minimumScore));
      const attendanceSatisfied =
        task.minimumAttendance == null ||
        (linkedAttendance != null && linkedAttendance >= Number(task.minimumAttendance));
      const evidenceSatisfied =
        linkedSatisfied &&
        (!submissionRequired || Boolean(submission)) &&
        approvalsSatisfied &&
        peerReviewsSatisfied &&
        scoreSatisfied &&
        attendanceSatisfied;
      const waived = existingTaskProgress?.status === "WAIVED";
      const satisfied = waived || evidenceSatisfied;
      const progressStatus = evidenceSatisfied
        ? "COMPLETED"
        : submissions.length > 0 || linkedSatisfied
          ? "IN_PROGRESS"
          : "NOT_STARTED";

      if (!waived) {
        await tx.programTaskProgress.upsert({
          where: {
            programTaskId_programEnrollmentId: {
              programTaskId: task.id,
              programEnrollmentId,
            },
          },
          create: {
            companyId: context.companyId,
            programTaskId: task.id,
            programEnrollmentId,
            status: progressStatus,
            completedAt: progressStatus === "COMPLETED" ? now : null,
          },
          update: {
            status: progressStatus,
            completedAt:
              progressStatus === "COMPLETED"
                ? (existingTaskProgress?.completedAt ?? now)
                : null,
            waivedAt: null,
            waivedBy: null,
            waiverReason: null,
          },
        });
      }

      taskResults.push({
        taskId: task.id,
        linkedEntity: task.taskType.linkedEntity,
        satisfied,
        status: waived ? "WAIVED" : progressStatus,
        phaseNumber: task.phaseNumber ?? 1,
        isBlocking: task.isBlocking,
        submissionId: submission?.id ?? null,
      });
    }

    for (const course of courseResults) {
      if (!course.enrollmentId || course.enrollmentStatus === "COMPLETED") continue;
      const unlocked = !taskResults.some(
        (task) =>
          task.isBlocking &&
          task.phaseNumber < course.phaseNumber &&
          !task.satisfied,
      );
      const targetStatus = unlocked ? "ACTIVE" : "PENDING";
      if (course.enrollmentStatus !== targetStatus) {
        await tx.enrollment.update({
          where: { id: course.enrollmentId },
          data: { status: targetStatus },
        });
      }
    }

    const completedRequirements =
      courseResults.filter((course) => course.satisfied).length +
      taskResults.filter((task) => task.satisfied).length;
    const totalRequirements = courseResults.length + taskResults.length;
    const progressPercentage = percentage(completedRequirements, totalRequirements);
    await tx.programEnrollment.update({
      where: { id: programEnrollmentId },
      data: { progressPercentage },
    });

    const milestones = await tx.programMilestone.findMany({
      where: { companyId: context.companyId, programId: programEnrollment.programId },
      select: { id: true, milestonePercentage: true },
    });
    for (const milestone of milestones) {
      const achieved = progressPercentage >= Number(milestone.milestonePercentage);
      await tx.programMilestoneProgress.upsert({
        where: {
          milestoneId_programEnrollmentId: {
            milestoneId: milestone.id,
            programEnrollmentId,
          },
        },
        create: {
          companyId: context.companyId,
          milestoneId: milestone.id,
          programEnrollmentId,
          status: achieved ? "ACHIEVED" : "NOT_STARTED",
          achievedAt: achieved ? now : null,
        },
        update: {
          status: achieved ? "ACHIEVED" : "NOT_STARTED",
          achievedAt: achieved ? now : null,
        },
      });
    }

    const eligible =
      totalRequirements > 0 && completedRequirements === totalRequirements;
    const snapshot = {
      evaluatorVersion: 1,
      evaluatedAt: now,
      eligible,
      progressPercentage,
      requiredCourses: courseResults,
      requiredOrBlockingTasks: taskResults,
    };
    const dispatches: DispatchResult[] = [];
    const outboxIds: number[] = [];
    let completion = programEnrollment.completion;
    if (eligible && !completion) {
      completion = await tx.programCompletion.create({
        data: {
          companyId: context.companyId,
          programEnrollmentId,
          completedAt: now,
          completionSnapshot: json(snapshot),
        },
      });
      await tx.programEnrollment.update({
        where: { id: programEnrollmentId },
        data: { enrollmentStatus: "COMPLETED", progressPercentage: 100, completedAt: now },
      });
      await tx.auditLog.create({
        data: {
          companyId: context.companyId,
          actorUserId: context.userId,
          entityType: "PROGRAM_COMPLETION",
          entityId: String(completion.id),
          action: "AUTOMATICALLY_COMPLETED",
          afterJson: json(snapshot),
        },
      });
      const outbox = await tx.completionOutbox.create({
        data: {
          companyId: context.companyId,
          eventKey: `program-completion:${completion.id}`,
          eventType: "PROGRAM_COMPLETED",
          programCompletionId: completion.id,
        },
        select: { id: true },
      });
      outboxIds.push(outbox.id);
      dispatches.push(
        await this.notifier.dispatch(tx, {
          companyId: context.companyId,
          eventCode: "PROGRAM_COMPLETED",
          recipientUserIds: programEnrollment.employee.appUsers.map((user) => user.id),
          entityType: "PROGRAM_COMPLETION",
          entityId: String(completion.id),
          occurrenceKey: "completed",
          actionUrl: `/?screen=my-programs&programId=${programEnrollment.program.id}`,
          variables: { programTitle: programEnrollment.program.name },
        }),
      );
    }
    return {
      value: { programEnrollmentId, progressPercentage, evaluation: snapshot, completion },
      dispatches,
      outboxIds,
    };
  }
}

export const enrollmentProgressService = new EnrollmentProgressService(
  new EnrollmentProgressRepository(getPrismaClient()),
);
