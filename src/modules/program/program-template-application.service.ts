import { Prisma, type TaskLinkedEntity } from "@prisma/client";
import { roleProfileFromName } from "../../common/constants/access-control-permission.constant.js";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../common/errors/http-errors.js";
import { calculateDurationDays } from "./program-details.dto.js";
import {
  programTemplateDefaultCoursesSchema,
  programTemplateDefaultMilestonesSchema,
  programTemplateDefaultTasksSchema,
} from "./program-template-application.dto.js";
import type {
  ApplyProgramTemplateInput,
  ProgramTemplateApplicationContext,
  ProgramTemplateApplicationRepositoryPort,
  ProgramTemplateApplicationTransaction,
  ProgramTemplateDefaultCourse,
  ProgramTemplateDefaultMilestone,
  ProgramTemplateDefaultTask,
  SaveProgramAsTemplateInput,
} from "./program-template-application.types.js";

const DAY_MS = 86_400_000;

const programDisplaySelect = {
  id: true,
  companyId: true,
  name: true,
  description: true,
  programTypeId: true,
  programCategoryId: true,
  ownerEmployeeId: true,
  visibility: true,
  status: true,
  startDate: true,
  endDate: true,
  durationDays: true,
  rollingEnrollment: true,
  maxEnrollments: true,
  approvalStatus: true,
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
  programType: { select: { id: true, name: true } },
  programCategory: { select: { id: true, name: true, color: true } },
  owner: { select: { id: true, fullName: true } },
} satisfies Prisma.LearningProgramSelect;

const templateDisplaySelect = {
  id: true,
  companyId: true,
  name: true,
  description: true,
  categoryId: true,
  programTypeId: true,
  durationWeeks: true,
  visibility: true,
  ownerEmployeeId: true,
  isMandatory: true,
  autoEnroll: true,
  allowSelfEnrollment: true,
  rollingEnrollment: true,
  capacity: true,
  certificateEnabled: true,
  xpEnabled: true,
  defaultMilestones: true,
  defaultCourses: true,
  defaultTasks: true,
  isActive: true,
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true } },
  owner: { select: { id: true, fullName: true } },
  creator: { select: { id: true, email: true } },
} satisfies Prisma.ProgramTemplateSelect;

const ownerSelect = (companyId: number) => ({
  id: true,
  isActive: true,
  appUsers: {
    where: { companyId, isActive: true },
    select: {
      role: { select: { name: true, isActive: true } },
      primaryEmRole: { select: { name: true, isActive: true } },
      roleAssignments: {
        where: {
          companyId,
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        select: { appRole: { select: { name: true, isActive: true } } },
      },
    },
  },
}) satisfies Prisma.EmployeeSelect;

type SelectedOwner = Prisma.EmployeeGetPayload<{ select: ReturnType<typeof ownerSelect> }>;

const isHrEligible = (owner: SelectedOwner): boolean =>
  owner.appUsers.some((user) => {
    const roleNames = [
      ...(user.role?.isActive ? [user.role.name] : []),
      ...(user.primaryEmRole?.isActive ? [user.primaryEmRole.name] : []),
      ...user.roleAssignments
        .filter((assignment) => assignment.appRole.isActive)
        .map((assignment) => assignment.appRole.name),
    ];
    return roleNames.some((name) => {
      const profile = roleProfileFromName(name);
      return profile === "hr" || profile === "admin";
    });
  });

const jsonValue = (value: unknown): Prisma.JsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.JsonValue;

const auditJson = (value: unknown): Prisma.InputJsonValue =>
  jsonValue(value) as Prisma.InputJsonValue;

const jsonInput = (
  value: Record<string, unknown> | null | undefined,
): Prisma.InputJsonValue | typeof Prisma.DbNull =>
  value == null ? Prisma.DbNull : auditJson(value);

const parseDefaults = <T>(
  schema: { safeParse(value: unknown): { success: true; data: T } | { success: false; error: { issues: unknown } } },
  value: Prisma.JsonValue | null,
  label: string,
): T => {
  const result = schema.safeParse(value ?? []);
  if (!result.success) {
    throw new ValidationError(`Program template ${label} are invalid.`, result.error.issues);
  }
  return result.data;
};

const assertUniqueMaterializedOrders = (
  courses: ProgramTemplateDefaultCourse[],
  tasks: ProgramTemplateDefaultTask[],
) => {
  const courseOrders = courses.map((course, index) => course.displayOrder ?? index + 1);
  if (new Set(courseOrders).size !== courseOrders.length) {
    throw new ValidationError("Program template course display orders are invalid after materialization.");
  }
  const taskOrders = tasks.map((task, index) => task.displayOrder ?? index + 1);
  if (new Set(taskOrders).size !== taskOrders.length) {
    throw new ValidationError("Program template task display orders are invalid after materialization.");
  }
};

const assertWithinProgramDates = (
  date: Date | null | undefined,
  startDate: Date | null,
  endDate: Date | null,
  label: string,
) => {
  if (!date) return;
  if (startDate && date.getTime() < startDate.getTime()) {
    throw new ValidationError(`${label} cannot be before the program start date.`);
  }
  if (endDate && date.getTime() > endDate.getTime()) {
    throw new ValidationError(`${label} cannot be after the program end date.`);
  }
};

const assertOffsetWithinDuration = (
  offset: number | null | undefined,
  durationDays: number | null,
  label: string,
) => {
  if (offset != null && durationDays != null && offset > durationDays) {
    throw new ValidationError(`${label} cannot exceed the program duration of ${durationDays} days.`);
  }
};

const taskLinkFields = [
  "courseVersionId",
  "courseContentId",
  "assessmentId",
  "liveSessionId",
  "surveyId",
] as const;

const linkedFieldByType: Record<Exclude<TaskLinkedEntity, "NONE">, (typeof taskLinkFields)[number]> = {
  COURSE_VERSION: "courseVersionId",
  COURSE_CONTENT: "courseContentId",
  ASSESSMENT: "assessmentId",
  LIVE_SESSION: "liveSessionId",
  SURVEY: "surveyId",
};

export class ProgramTemplateApplicationService {
  constructor(private readonly repository: ProgramTemplateApplicationRepositoryPort) { }

  private async validateOwner(
    tx: ProgramTemplateApplicationTransaction,
    companyId: number,
    ownerEmployeeId: string,
  ) {
    const owner = await tx.employee.findFirst({
      where: { id: ownerEmployeeId, companyId },
      select: ownerSelect(companyId),
    });
    if (!owner?.isActive) {
      throw new ValidationError("Owner employee must be active and belong to the authenticated company.");
    }
    if (!isHrEligible(owner)) {
      throw new ValidationError("Owner employee must have an active HR or administrator role.");
    }
  }

  private async validateComposition(
    tx: ProgramTemplateApplicationTransaction,
    companyId: number,
    courses: ProgramTemplateDefaultCourse[],
    tasks: ProgramTemplateDefaultTask[],
    milestones: ProgramTemplateDefaultMilestone[],
    startDate: Date | null,
    endDate: Date | null,
    durationDays: number | null,
  ) {
    assertUniqueMaterializedOrders(courses, tasks);

    const courseVersionIds = courses.map((course) => course.courseVersionId);
    const versions = courseVersionIds.length
      ? await tx.courseVersion.findMany({
        where: {
          id: { in: courseVersionIds },
          companyId,
          deletedAt: null,
          status: "PUBLISHED",
          approvalStatus: "APPROVED",
          course: { deletedAt: null, status: "PUBLISHED" },
        },
        select: { id: true },
      })
      : [];
    if (versions.length !== courseVersionIds.length) {
      throw new ValidationError(
        "Every template course version must be published, approved, active, and belong to the authenticated company.",
      );
    }
    const composedCourseIds = new Set(courseVersionIds);

    const taskTypeIds = [...new Set(tasks.map((task) => task.taskTypeId))];
    const taskTypes = taskTypeIds.length
      ? await tx.taskType.findMany({
        where: { id: { in: taskTypeIds }, companyId, isActive: true, deletedAt: null },
        select: { id: true, name: true, linkedEntity: true },
      })
      : [];
    if (taskTypes.length !== taskTypeIds.length) {
      throw new ValidationError("Every template task type must be active and belong to the authenticated company.");
    }
    const taskTypeById = new Map(taskTypes.map((taskType) => [taskType.id, taskType]));

    for (const task of tasks) {
      assertWithinProgramDates(task.dueDate, startDate, endDate, `Task '${task.title}' due date`);
      assertOffsetWithinDuration(task.dueOffsetDays, durationDays, `Task '${task.title}' due offset`);

      const taskType = taskTypeById.get(task.taskTypeId)!;
      const populated = taskLinkFields.filter((field) => task[field] != null);
      if (taskType.linkedEntity === "NONE") {
        if (populated.length) {
          throw new ValidationError(`Task '${task.title}' uses a task type that does not allow a linked entity.`);
        }
        continue;
      }

      const requiredField = linkedFieldByType[taskType.linkedEntity];
      const linkedId = task[requiredField];
      if (linkedId == null || populated.length !== 1) {
        throw new ValidationError(
          `Task '${task.title}' requires exactly one ${requiredField} link for task type '${taskType.name}'.`,
        );
      }
      if (taskType.linkedEntity === "LIVE_SESSION") {
        throw new ValidationError("Program templates cannot contain tasks linked to program-specific live sessions.");
      }

      if (taskType.linkedEntity === "COURSE_VERSION") {
        if (!composedCourseIds.has(linkedId)) {
          throw new ValidationError(`Task '${task.title}' must link to a course version in the template.`);
        }
      } else if (taskType.linkedEntity === "COURSE_CONTENT") {
        const content = await tx.courseContent.findFirst({
          where: { id: linkedId, companyId, deletedAt: null },
          select: { chapter: { select: { courseVersionId: true, status: true, deletedAt: true } } },
        });
        if (
          !content ||
          content.chapter.deletedAt ||
          content.chapter.status !== "PUBLISHED" ||
          !composedCourseIds.has(content.chapter.courseVersionId)
        ) {
          throw new ValidationError(`Task '${task.title}' must link to published content in a template course.`);
        }
      } else if (taskType.linkedEntity === "ASSESSMENT") {
        const assessment = await tx.assessment.findFirst({
          where: { id: linkedId, companyId, deletedAt: null, status: "PUBLISHED" },
          select: { courseVersionId: true },
        });
        if (!assessment || !composedCourseIds.has(assessment.courseVersionId)) {
          throw new ValidationError(`Task '${task.title}' must link to a published assessment in a template course.`);
        }
      } else {
        const survey = await tx.survey.findFirst({
          where: { id: linkedId, companyId, deletedAt: null, status: "ACTIVE" },
          select: { courseVersionId: true },
        });
        if (!survey || (survey.courseVersionId != null && !composedCourseIds.has(survey.courseVersionId))) {
          throw new ValidationError(`Task '${task.title}' must link to an active survey available to the template.`);
        }
      }
    }

    for (const milestone of milestones) {
      assertWithinProgramDates(
        milestone.targetDate,
        startDate,
        endDate,
        `Milestone '${milestone.title}' target date`,
      );
      assertOffsetWithinDuration(
        milestone.targetOffsetDays,
        durationDays,
        `Milestone '${milestone.title}' target offset`,
      );
    }
  }

  async apply(
    context: ProgramTemplateApplicationContext,
    templateId: number,
    input: ApplyProgramTemplateInput,
  ) {
    return this.repository.transaction(async (tx) => {
      const template = await tx.programTemplate.findFirst({
        where: { id: templateId, companyId: context.companyId, deletedAt: null },
      });
      if (!template) throw new NotFoundError("Program template");
      if (!template.isActive) throw new ValidationError("Only active program templates can be applied.");
      if (!template.programTypeId) {
        throw new ValidationError("Program template must define a program type before it can be applied.");
      }

      const duplicate = await tx.learningProgram.findFirst({
        where: {
          companyId: context.companyId,
          deletedAt: null,
          name: { equals: input.name, mode: "insensitive" },
        },
        select: { id: true },
      });
      if (duplicate) {
        throw new ConflictError(`A program named '${input.name}' already exists in this company.`);
      }

      const [programType, category] = await Promise.all([
        tx.programType.findFirst({
          where: { id: template.programTypeId, companyId: context.companyId, isActive: true, deletedAt: null },
          select: { id: true },
        }),
        template.categoryId
          ? tx.programCategory.findFirst({
            where: { id: template.categoryId, companyId: context.companyId, isActive: true, deletedAt: null },
            select: { id: true },
          })
          : Promise.resolve(null),
      ]);
      if (!programType) {
        throw new ValidationError("Program type must be active and belong to the authenticated company.");
      }
      if (template.categoryId && !category) {
        throw new ValidationError("Program category must be active and belong to the authenticated company.");
      }

      const ownerEmployeeId = input.ownerEmployeeId ?? template.ownerEmployeeId;
      await this.validateOwner(tx, context.companyId, ownerEmployeeId);

      const courses = parseDefaults<ProgramTemplateDefaultCourse[]>(
        programTemplateDefaultCoursesSchema,
        template.defaultCourses,
        "default courses",
      );
      const tasks = parseDefaults<ProgramTemplateDefaultTask[]>(
        programTemplateDefaultTasksSchema,
        template.defaultTasks,
        "default tasks",
      );
      const milestones = parseDefaults<ProgramTemplateDefaultMilestone[]>(
        programTemplateDefaultMilestonesSchema,
        template.defaultMilestones,
        "default milestones",
      );

      const startDate = input.startDate ?? null;
      let endDate = input.endDate ?? null;
      if (!endDate && startDate && template.durationWeeks && template.durationWeeks > 0) {
        endDate = new Date(startDate.getTime() + template.durationWeeks * 7 * DAY_MS);
      }
      if (startDate && endDate && endDate.getTime() <= startDate.getTime()) {
        throw new ValidationError("End date must be after start date.");
      }
      const durationDays = startDate && endDate ? calculateDurationDays(startDate, endDate) : null;

      await this.validateComposition(
        tx,
        context.companyId,
        courses,
        tasks,
        milestones,
        startDate,
        endDate,
        durationDays,
      );

      const program = await tx.learningProgram.create({
        data: {
          companyId: context.companyId,
          name: input.name,
          description: template.description,
          programTypeId: template.programTypeId,
          programCategoryId: template.categoryId,
          ownerEmployeeId,
          visibility: template.visibility,
          status: "DRAFT",
          startDate,
          endDate,
          durationDays,
          rollingEnrollment: template.rollingEnrollment,
          maxEnrollments: template.capacity,
          approvalStatus: "PENDING",
          createdBy: context.userId,
        },
        select: programDisplaySelect,
      });

      if (courses.length) {
        await tx.programCourse.createMany({
          data: courses.map((course, index) => ({
            companyId: context.companyId,
            programId: program.id,
            courseVersionId: course.courseVersionId,
            displayOrder: course.displayOrder ?? index + 1,
            isRequired: course.isRequired,
          })),
        });
      }
      if (tasks.length) {
        await tx.programTask.createMany({
          data: tasks.map((task, index) => ({
            companyId: context.companyId,
            programId: program.id,
            title: task.title,
            description: task.description ?? null,
            taskTypeId: task.taskTypeId,
            courseVersionId: task.courseVersionId ?? null,
            courseContentId: task.courseContentId ?? null,
            assessmentId: task.assessmentId ?? null,
            liveSessionId: null,
            surveyId: task.surveyId ?? null,
            maxSubmissions: task.maxSubmissions,
            allowResubmission: task.allowResubmission,
            isRequired: task.isRequired,
            isBlocking: task.isBlocking,
            displayOrder: task.displayOrder ?? index + 1,
            phaseNumber: task.phaseNumber ?? null,
            dueDate: task.dueDate ?? null,
            dueOffsetDays: task.dueOffsetDays ?? null,
            minimumTimeMinutes: task.minimumTimeMinutes ?? null,
            minimumScore: task.minimumScore ?? null,
            minimumAttendance: task.minimumAttendance ?? null,
            requiresManagerApproval: task.requiresManagerApproval,
            peerReviewRequired: task.peerReviewRequired,
            requiredPeerReviewCount: task.requiredPeerReviewCount,
            xpAward: task.xpAward ?? null,
          })),
        });
      }
      if (milestones.length) {
        await tx.programMilestone.createMany({
          data: milestones.map((milestone) => ({
            companyId: context.companyId,
            programId: program.id,
            title: milestone.title,
            milestonePercentage: milestone.milestonePercentage,
            targetDate: milestone.targetDate ?? null,
            targetOffsetDays: milestone.targetOffsetDays ?? null,
            completionExpression: jsonInput(milestone.completionExpression),
            overdueAction: milestone.overdueAction ?? null,
            reminderOffsetsDays: milestone.reminderOffsetsDays,
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          companyId: context.companyId,
          actorUserId: context.userId,
          entityType: "LEARNING_PROGRAM",
          entityId: String(program.id),
          action: "CREATED_FROM_TEMPLATE",
          afterJson: auditJson({
            ...program,
            sourceTemplateId: template.id,
            materialized: {
              courses: courses.length,
              tasks: tasks.length,
              milestones: milestones.length,
            },
          }),
        },
      });
      return program;
    });
  }

  async saveAsTemplate(
    context: ProgramTemplateApplicationContext,
    programId: number,
    input: SaveProgramAsTemplateInput,
  ) {
    return this.repository.transaction(async (tx) => {
      const source = await tx.learningProgram.findFirst({
        where: { id: programId, companyId: context.companyId, deletedAt: null },
        select: {
          id: true,
          description: true,
          programTypeId: true,
          programCategoryId: true,
          ownerEmployeeId: true,
          visibility: true,
          durationDays: true,
          startDate: true,
          endDate: true,
          rollingEnrollment: true,
          maxEnrollments: true,
          courses: {
            orderBy: { displayOrder: "asc" },
            select: { courseVersionId: true, displayOrder: true, isRequired: true },
          },
          tasks: {
            where: { deletedAt: null },
            orderBy: { displayOrder: "asc" },
            select: {
              title: true,
              description: true,
              taskTypeId: true,
              courseVersionId: true,
              courseContentId: true,
              assessmentId: true,
              liveSessionId: true,
              surveyId: true,
              maxSubmissions: true,
              allowResubmission: true,
              isRequired: true,
              isBlocking: true,
              displayOrder: true,
              phaseNumber: true,
              dueDate: true,
              dueOffsetDays: true,
              minimumTimeMinutes: true,
              minimumScore: true,
              minimumAttendance: true,
              requiresManagerApproval: true,
              peerReviewRequired: true,
              requiredPeerReviewCount: true,
              xpAward: true,
            },
          },
          milestones: {
            orderBy: { milestonePercentage: "asc" },
            select: {
              title: true,
              milestonePercentage: true,
              targetDate: true,
              targetOffsetDays: true,
              completionExpression: true,
              overdueAction: true,
              reminderOffsetsDays: true,
            },
          },
        },
      });
      if (!source) throw new NotFoundError("Learning program");

      const duplicate = await tx.programTemplate.findFirst({
        where: {
          companyId: context.companyId,
          deletedAt: null,
          name: { equals: input.name, mode: "insensitive" },
        },
        select: { id: true },
      });
      if (duplicate) {
        throw new ConflictError(`Program template with name '${input.name}' already exists.`);
      }
      if (source.tasks.some((task) => task.liveSessionId != null)) {
        throw new ValidationError("Programs with live-session-linked tasks cannot be saved as reusable templates.");
      }

      const [programType, category] = await Promise.all([
        tx.programType.findFirst({
          where: { id: source.programTypeId, companyId: context.companyId, isActive: true, deletedAt: null },
          select: { id: true },
        }),
        source.programCategoryId
          ? tx.programCategory.findFirst({
            where: { id: source.programCategoryId, companyId: context.companyId, isActive: true, deletedAt: null },
            select: { id: true },
          })
          : Promise.resolve(null),
      ]);
      if (!programType) {
        throw new ValidationError("Program type must be active and belong to the authenticated company.");
      }
      if (source.programCategoryId && !category) {
        throw new ValidationError("Program category must be active and belong to the authenticated company.");
      }
      await this.validateOwner(tx, context.companyId, source.ownerEmployeeId);

      const defaultCourses = parseDefaults<ProgramTemplateDefaultCourse[]>(
        programTemplateDefaultCoursesSchema,
        jsonValue(source.courses),
        "default courses",
      );
      const serializedTasks = source.tasks.map((task) => ({
        ...task,
        liveSessionId: null,
        dueDate: task.dueDate?.toISOString() ?? null,
        minimumScore: task.minimumScore == null ? null : Number(task.minimumScore),
        minimumAttendance: task.minimumAttendance == null ? null : Number(task.minimumAttendance),
      }));
      const defaultTasks = parseDefaults<ProgramTemplateDefaultTask[]>(
        programTemplateDefaultTasksSchema,
        jsonValue(serializedTasks),
        "default tasks",
      );
      const serializedMilestones = source.milestones.map((milestone) => ({
        ...milestone,
        milestonePercentage: Number(milestone.milestonePercentage),
        targetDate: milestone.targetDate?.toISOString() ?? null,
      }));
      const defaultMilestones = parseDefaults<ProgramTemplateDefaultMilestone[]>(
        programTemplateDefaultMilestonesSchema,
        jsonValue(serializedMilestones),
        "default milestones",
      );

      await this.validateComposition(
        tx,
        context.companyId,
        defaultCourses,
        defaultTasks,
        defaultMilestones,
        source.startDate,
        source.endDate,
        source.durationDays,
      );

      const template = await tx.programTemplate.create({
        data: {
          companyId: context.companyId,
          name: input.name,
          description: input.description === undefined ? source.description : input.description,
          categoryId: source.programCategoryId,
          programTypeId: source.programTypeId,
          durationWeeks: source.durationDays == null ? null : Math.ceil(source.durationDays / 7),
          visibility: source.visibility,
          ownerEmployeeId: source.ownerEmployeeId,
          rollingEnrollment: source.rollingEnrollment,
          capacity: source.maxEnrollments,
          defaultCourses: auditJson(defaultCourses),
          defaultTasks: auditJson(defaultTasks),
          defaultMilestones: auditJson(defaultMilestones),
          isActive: true,
          createdBy: context.userId,
          updatedBy: context.userId,
        },
        select: templateDisplaySelect,
      });

      await tx.auditLog.create({
        data: {
          companyId: context.companyId,
          actorUserId: context.userId,
          entityType: "PROGRAM_TEMPLATE",
          entityId: String(template.id),
          action: "CREATED_FROM_PROGRAM",
          afterJson: auditJson({ ...template, sourceProgramId: source.id }),
        },
      });
      return template;
    });
  }
}
