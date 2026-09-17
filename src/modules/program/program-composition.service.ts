import { Prisma, type TaskLinkedEntity } from "@prisma/client";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../common/errors/http-errors.js";
import {
  cohortDisplaySelect,
  courseDisplaySelect,
  milestoneDisplaySelect,
  ProgramCompositionRepository,
  taskDisplaySelect,
} from "./program-composition.repository.js";
import type {
  CompositionContext,
  CompositionOrderInput,
  CompositionTransaction,
  CreateProgramCohortInput,
  CreateProgramCourseInput,
  CreateProgramMilestoneInput,
  CreateProgramTaskInput,
  ReplaceTargetAudiencesInput,
  TaskLinkState,
  UpdateProgramCohortInput,
  UpdateProgramCourseInput,
  UpdateProgramMilestoneInput,
  UpdateProgramTaskInput,
} from "./program-composition.types.js";

const taskLinkFields = [
  "courseVersionId",
  "courseContentId",
  "assessmentId",
  "liveSessionId",
  "surveyId",
] as const;

const linkedFieldByType: Record<Exclude<TaskLinkedEntity, "NONE">, keyof TaskLinkState> = {
  COURSE_VERSION: "courseVersionId",
  COURSE_CONTENT: "courseContentId",
  ASSESSMENT: "assessmentId",
  LIVE_SESSION: "liveSessionId",
  SURVEY: "surveyId",
};

const auditJson = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

const createAudit = (
  tx: CompositionTransaction,
  context: CompositionContext,
  entityType: string,
  entityId: number,
  action: string,
  before?: unknown,
  after?: unknown,
) =>
  tx.auditLog.create({
    data: {
      companyId: context.companyId,
      actorUserId: context.userId,
      entityType,
      entityId: String(entityId),
      action,
      ...(before === undefined ? {} : { beforeJson: auditJson(before) }),
      ...(after === undefined ? {} : { afterJson: auditJson(after) }),
    },
  });

const assertWithinProgramDates = (
  date: Date | null | undefined,
  program: { startDate: Date | null; endDate: Date | null },
  fieldName: string,
) => {
  if (!date) return;
  if (program.startDate && date.getTime() < program.startDate.getTime()) {
    throw new ValidationError(`${fieldName} cannot be before the program start date.`);
  }
  if (program.endDate && date.getTime() > program.endDate.getTime()) {
    throw new ValidationError(`${fieldName} cannot be after the program end date.`);
  }
};

const assertDateRange = (startDate: Date | null, endDate: Date | null) => {
  if (startDate && endDate && endDate.getTime() <= startDate.getTime()) {
    throw new ValidationError("End date must be after start date.");
  }
};

const assertOffsetWithinProgramDuration = (
  offsetDays: number | null | undefined,
  program: { startDate: Date | null; endDate: Date | null },
  fieldName: string,
) => {
  if (offsetDays == null || !program.startDate || !program.endDate) return;
  const durationDays = Math.ceil(
    (program.endDate.getTime() - program.startDate.getTime()) / 86_400_000,
  );
  if (offsetDays > durationDays) {
    throw new ValidationError(`${fieldName} cannot exceed the program duration of ${durationDays} days.`);
  }
};

export class ProgramCompositionService {
  constructor(private readonly repository: ProgramCompositionRepository) { }

  private async assertReadable(companyId: number, programId: number) {
    const program = await this.repository.findProgram(companyId, programId);
    if (!program) throw new NotFoundError("Learning program");
    return program;
  }

  private async assertWritable(
    tx: CompositionTransaction,
    companyId: number,
    programId: number,
  ) {
    const program = await tx.learningProgram.findFirst({
      where: { id: programId, companyId, deletedAt: null },
      select: { id: true, name: true, status: true, startDate: true, endDate: true },
    });
    if (!program) throw new NotFoundError("Learning program");
    if (program.status !== "DRAFT") {
      throw new ConflictError("Program composition can only be changed while the program is DRAFT.");
    }

    const pendingApproval = await tx.approvalWorkflowInstance.findFirst({
      where: { companyId, learningProgramId: programId, status: "PENDING" },
      select: { id: true },
    });
    if (pendingApproval) {
      throw new ConflictError(
        "Program composition cannot be changed while a publishing approval is pending.",
      );
    }
    return program;
  }

  private async reorderCourses(
    tx: CompositionTransaction,
    companyId: number,
    programId: number,
    orderedIds: number[],
  ) {
    const maximum = await tx.programCourse.aggregate({
      where: { companyId, programId },
      _max: { displayOrder: true },
    });
    const temporaryStart = (maximum._max.displayOrder ?? 0) + 1;
    for (const [index, id] of orderedIds.entries()) {
      await tx.programCourse.update({
        where: { id },
        data: { displayOrder: temporaryStart + index },
      });
    }
    for (const [index, id] of orderedIds.entries()) {
      await tx.programCourse.update({ where: { id }, data: { displayOrder: index + 1 } });
    }
  }

  private async reorderTasks(
    tx: CompositionTransaction,
    companyId: number,
    programId: number,
    orderedIds: number[],
  ) {
    const allRows = await tx.programTask.findMany({
      where: { companyId, programId },
      select: { id: true },
    });
    const maximum = await tx.programTask.aggregate({
      where: { companyId, programId },
      _max: { displayOrder: true },
    });
    const temporaryStart = (maximum._max.displayOrder ?? 0) + 1;
    for (const [index, row] of allRows.entries()) {
      await tx.programTask.update({
        where: { id: row.id },
        data: { displayOrder: temporaryStart + index },
      });
    }
    const activeIds = new Set(orderedIds);
    for (const row of allRows) {
      if (!activeIds.has(row.id)) {
        await tx.programTask.update({ where: { id: row.id }, data: { displayOrder: -row.id } });
      }
    }
    for (const [index, id] of orderedIds.entries()) {
      await tx.programTask.update({ where: { id }, data: { displayOrder: index + 1 } });
    }
  }

  private async assertPublishedProgramCourseVersion(
    tx: CompositionTransaction,
    companyId: number,
    programId: number,
    courseVersionId: number,
    mustAlreadyBeComposed: boolean,
  ) {
    const version = await tx.courseVersion.findFirst({
      where: {
        id: courseVersionId,
        companyId,
        deletedAt: null,
        status: "PUBLISHED",
        approvalStatus: "APPROVED",
        course: { deletedAt: null, status: "PUBLISHED" },
      },
      select: {
        id: true,
        courseId: true,
        status: true,
        approvalStatus: true,
        course: { select: { id: true, title: true, status: true } },
      },
    });
    if (!version) {
      throw new ValidationError(
        "Course version must be published, approved, active, and belong to the authenticated company.",
      );
    }
    if (mustAlreadyBeComposed) {
      const composed = await tx.programCourse.findFirst({
        where: { companyId, programId, courseVersionId },
        select: { id: true },
      });
      if (!composed) {
        throw new ValidationError("The linked course version must already be part of this program.");
      }
    }
    return version;
  }

  private async validateTaskLink(
    tx: CompositionTransaction,
    companyId: number,
    programId: number,
    taskTypeId: number,
    links: TaskLinkState,
  ) {
    const taskType = await tx.taskType.findFirst({
      where: { id: taskTypeId, companyId, isActive: true, deletedAt: null },
      select: { id: true, name: true, linkedEntity: true, expectedSubmissionType: true },
    });
    if (!taskType) {
      throw new ValidationError("Task type must be active and belong to the authenticated company.");
    }

    const populated = taskLinkFields.filter((field) => links[field] != null);
    if (taskType.linkedEntity === "NONE") {
      if (populated.length > 0) {
        throw new ValidationError("This task type does not allow a linked entity.");
      }
      return taskType;
    }

    const requiredField = linkedFieldByType[taskType.linkedEntity];
    if (links[requiredField] == null || populated.length !== 1) {
      throw new ValidationError(
        `Task type '${taskType.name}' requires exactly one ${requiredField} link.`,
      );
    }

    const linkedId = links[requiredField]!;
    if (taskType.linkedEntity === "COURSE_VERSION") {
      await this.assertPublishedProgramCourseVersion(
        tx,
        companyId,
        programId,
        linkedId,
        true,
      );
    } else if (taskType.linkedEntity === "COURSE_CONTENT") {
      const content = await tx.courseContent.findFirst({
        where: { id: linkedId, companyId, deletedAt: null },
        select: { id: true, chapter: { select: { courseVersionId: true, status: true, deletedAt: true } } },
      });
      if (!content || content.chapter.deletedAt || content.chapter.status !== "PUBLISHED") {
        throw new ValidationError("Linked course content must be published and belong to this company.");
      }
      await this.assertPublishedProgramCourseVersion(
        tx,
        companyId,
        programId,
        content.chapter.courseVersionId,
        true,
      );
    } else if (taskType.linkedEntity === "ASSESSMENT") {
      const assessment = await tx.assessment.findFirst({
        where: { id: linkedId, companyId, deletedAt: null, status: "PUBLISHED" },
        select: { id: true, courseVersionId: true },
      });
      if (!assessment) {
        throw new ValidationError("Linked assessment must be published and belong to this company.");
      }
      await this.assertPublishedProgramCourseVersion(
        tx,
        companyId,
        programId,
        assessment.courseVersionId,
        true,
      );
    } else if (taskType.linkedEntity === "LIVE_SESSION") {
      const session = await tx.liveSession.findFirst({
        where: {
          id: linkedId,
          companyId,
          learningProgramId: programId,
          deletedAt: null,
          status: { in: ["SCHEDULED", "LIVE"] },
        },
        select: { id: true, courseVersionId: true },
      });
      if (!session) {
        throw new ValidationError("Linked live session must be active and belong to this program.");
      }
      await this.assertPublishedProgramCourseVersion(
        tx,
        companyId,
        programId,
        session.courseVersionId,
        true,
      );
    } else {
      const survey = await tx.survey.findFirst({
        where: { id: linkedId, companyId, deletedAt: null, status: "ACTIVE" },
        select: { id: true, courseVersionId: true },
      });
      if (!survey) {
        throw new ValidationError("Linked survey must be active and belong to this company.");
      }
      if (survey.courseVersionId) {
        await this.assertPublishedProgramCourseVersion(
          tx,
          companyId,
          programId,
          survey.courseVersionId,
          true,
        );
      }
    }
    return taskType;
  }

  async getTargetAudiences(companyId: number, programId: number) {
    await this.assertReadable(companyId, programId);
    return this.repository.listTargetAudiences(companyId, programId);
  }

  async replaceTargetAudiences(
    context: CompositionContext,
    programId: number,
    input: ReplaceTargetAudiencesInput,
  ) {
    return this.repository.transaction(async (tx) => {
      await this.assertWritable(tx, context.companyId, programId);
      const groups = await tx.audienceGroup.findMany({
        where: {
          id: { in: input.audienceGroupIds },
          companyId: context.companyId,
          isActive: true,
          deletedAt: null,
        },
        select: { id: true, name: true },
      });
      if (groups.length !== input.audienceGroupIds.length) {
        throw new ValidationError(
          "Every audience group must be active and belong to the authenticated company.",
        );
      }

      const before = await tx.targetAudience.findMany({
        where: {
          companyId: context.companyId,
          entityType: "LEARNING_PROGRAM",
          entityId: programId,
        },
        select: { id: true, audienceGroupId: true, audienceGroup: { select: { name: true } } },
      });
      const requested = new Set(input.audienceGroupIds);
      const removedIds = before.filter((item) => !requested.has(item.audienceGroupId)).map((item) => item.id);
      if (removedIds.length > 0) {
        const dependentRules = await tx.enrollmentRule.count({
          where: { companyId: context.companyId, targetAudienceId: { in: removedIds } },
        });
        if (dependentRules > 0) {
          throw new ConflictError(
            "Cannot remove a target audience that is referenced by an enrollment rule.",
          );
        }
        await tx.targetAudience.deleteMany({ where: { id: { in: removedIds }, companyId: context.companyId } });
      }
      const existingIds = new Set(before.map((item) => item.audienceGroupId));
      const additions = input.audienceGroupIds.filter((id) => !existingIds.has(id));
      if (additions.length > 0) {
        await tx.targetAudience.createMany({
          data: additions.map((audienceGroupId) => ({
            companyId: context.companyId,
            entityType: "LEARNING_PROGRAM" as const,
            entityId: programId,
            audienceGroupId,
          })),
        });
      }
      const after = await tx.targetAudience.findMany({
        where: { companyId: context.companyId, entityType: "LEARNING_PROGRAM", entityId: programId },
        select: {
          id: true,
          audienceGroupId: true,
          audienceGroup: { select: { id: true, name: true, description: true, isActive: true } },
        },
        orderBy: { audienceGroup: { name: "asc" } },
      });
      await createAudit(tx, context, "PROGRAM_TARGET_AUDIENCE", programId, "REPLACED", before, after);
      return after;
    });
  }

  async getCohorts(companyId: number, programId: number) {
    await this.assertReadable(companyId, programId);
    return this.repository.listCohorts(companyId, programId);
  }

  async createCohort(context: CompositionContext, programId: number, input: CreateProgramCohortInput) {
    return this.repository.transaction(async (tx) => {
      const program = await this.assertWritable(tx, context.companyId, programId);
      const startDate = input.startDate ?? null;
      const endDate = input.endDate ?? null;
      assertDateRange(startDate, endDate);
      assertWithinProgramDates(startDate, program, "Cohort start date");
      assertWithinProgramDates(endDate, program, "Cohort end date");
      const duplicate = await tx.programCohort.findFirst({
        where: { companyId: context.companyId, programId, name: { equals: input.name, mode: "insensitive" } },
        select: { id: true },
      });
      if (duplicate) throw new ConflictError("A cohort with this name already exists in the program.");
      const created = await tx.programCohort.create({
        data: { companyId: context.companyId, programId, ...input },
        select: cohortDisplaySelect,
      });
      await createAudit(tx, context, "PROGRAM_COHORT", created.id, "CREATED", undefined, created);
      return created;
    });
  }

  async updateCohort(
    context: CompositionContext,
    programId: number,
    cohortId: number,
    input: UpdateProgramCohortInput,
  ) {
    return this.repository.transaction(async (tx) => {
      const program = await this.assertWritable(tx, context.companyId, programId);
      const before = await tx.programCohort.findFirst({
        where: { id: cohortId, companyId: context.companyId, programId },
        select: cohortDisplaySelect,
      });
      if (!before) throw new NotFoundError("Program cohort");
      const startDate = input.startDate === undefined ? before.startDate : input.startDate;
      const endDate = input.endDate === undefined ? before.endDate : input.endDate;
      assertDateRange(startDate, endDate);
      assertWithinProgramDates(startDate, program, "Cohort start date");
      assertWithinProgramDates(endDate, program, "Cohort end date");
      if (input.name && input.name.toLowerCase() !== before.name.toLowerCase()) {
        const duplicate = await tx.programCohort.findFirst({
          where: { companyId: context.companyId, programId, id: { not: cohortId }, name: { equals: input.name, mode: "insensitive" } },
          select: { id: true },
        });
        if (duplicate) throw new ConflictError("A cohort with this name already exists in the program.");
      }
      const after = await tx.programCohort.update({
        where: { id: cohortId },
        data: input,
        select: cohortDisplaySelect,
      });
      await createAudit(tx, context, "PROGRAM_COHORT", cohortId, "UPDATED", before, after);
      return after;
    });
  }

  async deleteCohort(context: CompositionContext, programId: number, cohortId: number) {
    return this.repository.transaction(async (tx) => {
      await this.assertWritable(tx, context.companyId, programId);
      const before = await tx.programCohort.findFirst({
        where: { id: cohortId, companyId: context.companyId, programId },
        select: cohortDisplaySelect,
      });
      if (!before) throw new NotFoundError("Program cohort");
      if (before._count.enrollments > 0) {
        throw new ConflictError("Cannot delete a cohort that has enrollments.");
      }
      if (before._count.waitlistEntries > 0) {
        throw new ConflictError("Cannot delete a cohort that has waitlist history.");
      }
      await tx.programCohort.delete({ where: { id: cohortId } });
      await createAudit(tx, context, "PROGRAM_COHORT", cohortId, "DELETED", before);
      return { id: cohortId, deleted: true };
    });
  }

  async getCourses(companyId: number, programId: number) {
    await this.assertReadable(companyId, programId);
    return this.repository.listCourses(companyId, programId);
  }

  async createCourse(context: CompositionContext, programId: number, input: CreateProgramCourseInput) {
    return this.repository.transaction(async (tx) => {
      await this.assertWritable(tx, context.companyId, programId);
      await this.assertPublishedProgramCourseVersion(tx, context.companyId, programId, input.courseVersionId, false);
      const existing = await tx.programCourse.findMany({
        where: { companyId: context.companyId, programId },
        select: { id: true, courseVersionId: true },
        orderBy: { displayOrder: "asc" },
      });
      if (existing.some((item) => item.courseVersionId === input.courseVersionId)) {
        throw new ConflictError("This course version is already part of the program.");
      }
      const position = input.displayOrder ?? existing.length + 1;
      if (position > existing.length + 1) {
        throw new ValidationError(`displayOrder cannot exceed ${existing.length + 1}.`);
      }
      const createdBase = await tx.programCourse.create({
        data: {
          companyId: context.companyId,
          programId,
          courseVersionId: input.courseVersionId,
          displayOrder: existing.length + 1,
          phaseNumber: input.phaseNumber,
          isRequired: input.isRequired,
        },
        select: { id: true },
      });
      const orderedIds = existing.map((item) => item.id);
      orderedIds.splice(position - 1, 0, createdBase.id);
      await this.reorderCourses(tx, context.companyId, programId, orderedIds);
      const created = await tx.programCourse.findUniqueOrThrow({
        where: { id: createdBase.id },
        select: courseDisplaySelect,
      });
      await createAudit(tx, context, "PROGRAM_COURSE", created.id, "CREATED", undefined, created);
      return created;
    });
  }

  async updateCourse(
    context: CompositionContext,
    programId: number,
    programCourseId: number,
    input: UpdateProgramCourseInput,
  ) {
    return this.repository.transaction(async (tx) => {
      await this.assertWritable(tx, context.companyId, programId);
      const before = await tx.programCourse.findFirst({
        where: { id: programCourseId, companyId: context.companyId, programId },
        select: courseDisplaySelect,
      });
      if (!before) throw new NotFoundError("Program course");
      if (input.courseVersionId && input.courseVersionId !== before.courseVersionId) {
        await this.assertPublishedProgramCourseVersion(tx, context.companyId, programId, input.courseVersionId, false);
        const duplicate = await tx.programCourse.findFirst({
          where: { companyId: context.companyId, programId, courseVersionId: input.courseVersionId, id: { not: programCourseId } },
          select: { id: true },
        });
        if (duplicate) throw new ConflictError("This course version is already part of the program.");
      }
      await tx.programCourse.update({
        where: { id: programCourseId },
        data: {
          courseVersionId: input.courseVersionId,
          phaseNumber: input.phaseNumber,
          isRequired: input.isRequired,
        },
      });
      if (input.displayOrder !== undefined && input.displayOrder !== before.displayOrder) {
        const rows = await tx.programCourse.findMany({
          where: { companyId: context.companyId, programId },
          select: { id: true },
          orderBy: { displayOrder: "asc" },
        });
        if (input.displayOrder > rows.length) {
          throw new ValidationError(`displayOrder cannot exceed ${rows.length}.`);
        }
        const orderedIds = rows.map((row) => row.id).filter((id) => id !== programCourseId);
        orderedIds.splice(input.displayOrder - 1, 0, programCourseId);
        await this.reorderCourses(tx, context.companyId, programId, orderedIds);
      }
      const after = await tx.programCourse.findUniqueOrThrow({ where: { id: programCourseId }, select: courseDisplaySelect });
      await createAudit(tx, context, "PROGRAM_COURSE", programCourseId, "UPDATED", before, after);
      return after;
    });
  }

  async orderCourses(context: CompositionContext, programId: number, input: CompositionOrderInput) {
    return this.repository.transaction(async (tx) => {
      await this.assertWritable(tx, context.companyId, programId);
      const rows = await tx.programCourse.findMany({
        where: { companyId: context.companyId, programId },
        select: { id: true, displayOrder: true },
        orderBy: { displayOrder: "asc" },
      });
      if (rows.length !== input.orderedIds.length || rows.some((row) => !input.orderedIds.includes(row.id))) {
        throw new ValidationError("orderedIds must contain every program course ID exactly once.");
      }
      await this.reorderCourses(tx, context.companyId, programId, input.orderedIds);
      const after = await tx.programCourse.findMany({
        where: { companyId: context.companyId, programId }, select: courseDisplaySelect, orderBy: { displayOrder: "asc" },
      });
      await createAudit(tx, context, "PROGRAM_COURSE_ORDER", programId, "REORDERED", rows, after.map(({ id, displayOrder }) => ({ id, displayOrder })));
      return after;
    });
  }

  async deleteCourse(context: CompositionContext, programId: number, programCourseId: number) {
    return this.repository.transaction(async (tx) => {
      await this.assertWritable(tx, context.companyId, programId);
      const before = await tx.programCourse.findFirst({
        where: { id: programCourseId, companyId: context.companyId, programId }, select: courseDisplaySelect,
      });
      if (!before) throw new NotFoundError("Program course");
      const dependentEnrollments = await tx.enrollment.count({
        where: {
          companyId: context.companyId,
          courseVersionId: before.courseVersionId,
          programEnrollment: { programId, companyId: context.companyId },
        },
      });
      if (dependentEnrollments > 0) {
        throw new ConflictError("Cannot delete a program course with dependent learner progress.");
      }
      await tx.programCourse.delete({ where: { id: programCourseId } });
      const remaining = await tx.programCourse.findMany({
        where: { companyId: context.companyId, programId }, select: { id: true }, orderBy: { displayOrder: "asc" },
      });
      if (remaining.length > 0) await this.reorderCourses(tx, context.companyId, programId, remaining.map((row) => row.id));
      await createAudit(tx, context, "PROGRAM_COURSE", programCourseId, "DELETED", before);
      return { id: programCourseId, deleted: true };
    });
  }

  async getTasks(companyId: number, programId: number) {
    await this.assertReadable(companyId, programId);
    return this.repository.listTasks(companyId, programId);
  }

  async createTask(context: CompositionContext, programId: number, input: CreateProgramTaskInput) {
    return this.repository.transaction(async (tx) => {
      const program = await this.assertWritable(tx, context.companyId, programId);
      assertWithinProgramDates(input.dueDate, program, "Task due date");
      assertOffsetWithinProgramDuration(input.dueOffsetDays, program, "Task due offset");
      const links: TaskLinkState = {
        courseVersionId: input.courseVersionId ?? null,
        courseContentId: input.courseContentId ?? null,
        assessmentId: input.assessmentId ?? null,
        liveSessionId: input.liveSessionId ?? null,
        surveyId: input.surveyId ?? null,
      };
      await this.validateTaskLink(tx, context.companyId, programId, input.taskTypeId, links);
      const existing = await tx.programTask.findMany({
        where: { companyId: context.companyId, programId, deletedAt: null }, select: { id: true }, orderBy: { displayOrder: "asc" },
      });
      const position = input.displayOrder ?? existing.length + 1;
      if (position > existing.length + 1) throw new ValidationError(`displayOrder cannot exceed ${existing.length + 1}.`);
      // The unique key also covers soft-deleted tasks, so append beyond every row
      // before normalizing the active sequence.
      const maxOrder = await tx.programTask.aggregate({
        where: { companyId: context.companyId, programId },
        _max: { displayOrder: true },
      });
      const createdBase = await tx.programTask.create({
        data: {
          companyId: context.companyId,
          programId,
          ...input,
          ...links,
          displayOrder: (maxOrder._max.displayOrder ?? 0) + 1,
        },
        select: { id: true },
      });
      const orderedIds = existing.map((row) => row.id);
      orderedIds.splice(position - 1, 0, createdBase.id);
      await this.reorderTasks(tx, context.companyId, programId, orderedIds);
      const created = await tx.programTask.findUniqueOrThrow({ where: { id: createdBase.id }, select: taskDisplaySelect });
      await createAudit(tx, context, "PROGRAM_TASK", created.id, "CREATED", undefined, created);
      return created;
    });
  }

  async updateTask(
    context: CompositionContext,
    programId: number,
    taskId: number,
    input: UpdateProgramTaskInput,
  ) {
    return this.repository.transaction(async (tx) => {
      const program = await this.assertWritable(tx, context.companyId, programId);
      const before = await tx.programTask.findFirst({
        where: { id: taskId, companyId: context.companyId, programId, deletedAt: null }, select: taskDisplaySelect,
      });
      if (!before) throw new NotFoundError("Program task");
      const dueDate = input.dueDate === undefined ? before.dueDate : input.dueDate;
      const dueOffsetDays = input.dueOffsetDays === undefined ? before.dueOffsetDays : input.dueOffsetDays;
      if (dueDate != null && dueOffsetDays != null) {
        throw new ValidationError("dueDate and dueOffsetDays cannot both be set.");
      }
      assertWithinProgramDates(dueDate, program, "Task due date");
      assertOffsetWithinProgramDuration(dueOffsetDays, program, "Task due offset");
      const links = Object.fromEntries(
        taskLinkFields.map((field) => [field, input[field] === undefined ? before[field] : input[field]]),
      ) as TaskLinkState;
      await this.validateTaskLink(
        tx,
        context.companyId,
        programId,
        input.taskTypeId ?? before.taskTypeId,
        links,
      );
      await tx.programTask.update({
        where: { id: taskId },
        data: { ...input, ...links, displayOrder: undefined },
      });
      if (input.displayOrder !== undefined && input.displayOrder !== before.displayOrder) {
        const rows = await tx.programTask.findMany({
          where: { companyId: context.companyId, programId, deletedAt: null }, select: { id: true }, orderBy: { displayOrder: "asc" },
        });
        if (input.displayOrder > rows.length) throw new ValidationError(`displayOrder cannot exceed ${rows.length}.`);
        const orderedIds = rows.map((row) => row.id).filter((id) => id !== taskId);
        orderedIds.splice(input.displayOrder - 1, 0, taskId);
        await this.reorderTasks(tx, context.companyId, programId, orderedIds);
      }
      const after = await tx.programTask.findUniqueOrThrow({ where: { id: taskId }, select: taskDisplaySelect });
      await createAudit(tx, context, "PROGRAM_TASK", taskId, "UPDATED", before, after);
      return after;
    });
  }

  async orderTasks(context: CompositionContext, programId: number, input: CompositionOrderInput) {
    return this.repository.transaction(async (tx) => {
      await this.assertWritable(tx, context.companyId, programId);
      const rows = await tx.programTask.findMany({
        where: { companyId: context.companyId, programId, deletedAt: null }, select: { id: true, displayOrder: true }, orderBy: { displayOrder: "asc" },
      });
      if (rows.length !== input.orderedIds.length || rows.some((row) => !input.orderedIds.includes(row.id))) {
        throw new ValidationError("orderedIds must contain every active program task ID exactly once.");
      }
      await this.reorderTasks(tx, context.companyId, programId, input.orderedIds);
      const after = await tx.programTask.findMany({
        where: { companyId: context.companyId, programId, deletedAt: null }, select: taskDisplaySelect, orderBy: { displayOrder: "asc" },
      });
      await createAudit(tx, context, "PROGRAM_TASK_ORDER", programId, "REORDERED", rows, after.map(({ id, displayOrder }) => ({ id, displayOrder })));
      return after;
    });
  }

  async deleteTask(context: CompositionContext, programId: number, taskId: number) {
    return this.repository.transaction(async (tx) => {
      await this.assertWritable(tx, context.companyId, programId);
      const before = await tx.programTask.findFirst({
        where: { id: taskId, companyId: context.companyId, programId, deletedAt: null }, select: taskDisplaySelect,
      });
      if (!before) throw new NotFoundError("Program task");
      if (before._count.submissions > 0) {
        throw new ConflictError("Cannot delete a program task with dependent submissions.");
      }
      const minimum = await tx.programTask.aggregate({ where: { companyId: context.companyId, programId }, _min: { displayOrder: true } });
      const tombstoneOrder = Math.min(minimum._min.displayOrder ?? 0, 0) - 1;
      await tx.programTask.update({ where: { id: taskId }, data: { deletedAt: new Date(), displayOrder: tombstoneOrder } });
      const remaining = await tx.programTask.findMany({
        where: { companyId: context.companyId, programId, deletedAt: null }, select: { id: true }, orderBy: { displayOrder: "asc" },
      });
      if (remaining.length > 0) await this.reorderTasks(tx, context.companyId, programId, remaining.map((row) => row.id));
      await createAudit(tx, context, "PROGRAM_TASK", taskId, "DELETED", before);
      return { id: taskId, deleted: true };
    });
  }

  async getMilestones(companyId: number, programId: number) {
    await this.assertReadable(companyId, programId);
    return this.repository.listMilestones(companyId, programId);
  }

  async createMilestone(context: CompositionContext, programId: number, input: CreateProgramMilestoneInput) {
    return this.repository.transaction(async (tx) => {
      const program = await this.assertWritable(tx, context.companyId, programId);
      assertWithinProgramDates(input.targetDate, program, "Milestone target date");
      assertOffsetWithinProgramDuration(input.targetOffsetDays, program, "Milestone target offset");
      const duplicate = await tx.programMilestone.findFirst({
        where: { companyId: context.companyId, programId, milestonePercentage: input.milestonePercentage }, select: { id: true },
      });
      if (duplicate) throw new ConflictError("A milestone already exists at this percentage.");
      const created = await tx.programMilestone.create({
        data: {
          companyId: context.companyId,
          programId,
          title: input.title,
          milestonePercentage: input.milestonePercentage,
          targetDate: input.targetDate,
          targetOffsetDays: input.targetOffsetDays,
          completionExpression:
            input.completionExpression === null
              ? Prisma.DbNull
              : input.completionExpression === undefined
                ? undefined
                : auditJson(input.completionExpression),
          overdueAction: input.overdueAction,
          reminderOffsetsDays: input.reminderOffsetsDays,
        },
        select: milestoneDisplaySelect,
      });
      await createAudit(tx, context, "PROGRAM_MILESTONE", created.id, "CREATED", undefined, created);
      return created;
    });
  }

  async updateMilestone(
    context: CompositionContext,
    programId: number,
    milestoneId: number,
    input: UpdateProgramMilestoneInput,
  ) {
    return this.repository.transaction(async (tx) => {
      const program = await this.assertWritable(tx, context.companyId, programId);
      const before = await tx.programMilestone.findFirst({
        where: { id: milestoneId, companyId: context.companyId, programId }, select: milestoneDisplaySelect,
      });
      if (!before) throw new NotFoundError("Program milestone");
      const targetDate = input.targetDate === undefined ? before.targetDate : input.targetDate;
      const targetOffsetDays = input.targetOffsetDays === undefined ? before.targetOffsetDays : input.targetOffsetDays;
      if (targetDate != null && targetOffsetDays != null) {
        throw new ValidationError("targetDate and targetOffsetDays cannot both be set.");
      }
      assertWithinProgramDates(targetDate, program, "Milestone target date");
      assertOffsetWithinProgramDuration(targetOffsetDays, program, "Milestone target offset");
      if (input.milestonePercentage !== undefined && Number(before.milestonePercentage) !== input.milestonePercentage) {
        const duplicate = await tx.programMilestone.findFirst({
          where: { companyId: context.companyId, programId, id: { not: milestoneId }, milestonePercentage: input.milestonePercentage }, select: { id: true },
        });
        if (duplicate) throw new ConflictError("A milestone already exists at this percentage.");
      }
      const after = await tx.programMilestone.update({
        where: { id: milestoneId },
        data: {
          title: input.title,
          milestonePercentage: input.milestonePercentage,
          targetDate: input.targetDate,
          targetOffsetDays: input.targetOffsetDays,
          completionExpression:
            input.completionExpression === null
              ? Prisma.DbNull
              : input.completionExpression === undefined
                ? undefined
                : auditJson(input.completionExpression),
          overdueAction: input.overdueAction,
          reminderOffsetsDays: input.reminderOffsetsDays,
        },
        select: milestoneDisplaySelect,
      });
      await createAudit(tx, context, "PROGRAM_MILESTONE", milestoneId, "UPDATED", before, after);
      return after;
    });
  }

  async deleteMilestone(context: CompositionContext, programId: number, milestoneId: number) {
    return this.repository.transaction(async (tx) => {
      await this.assertWritable(tx, context.companyId, programId);
      const before = await tx.programMilestone.findFirst({
        where: { id: milestoneId, companyId: context.companyId, programId }, select: milestoneDisplaySelect,
      });
      if (!before) throw new NotFoundError("Program milestone");
      if (before._count.progresses > 0) {
        throw new ConflictError("Cannot delete a program milestone with dependent progress.");
      }
      await tx.programMilestone.delete({ where: { id: milestoneId } });
      await createAudit(tx, context, "PROGRAM_MILESTONE", milestoneId, "DELETED", before);
      return { id: milestoneId, deleted: true };
    });
  }
}
