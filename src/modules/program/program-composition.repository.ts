import type { Prisma, PrismaClient } from "@prisma/client";
import type { CompositionTransaction } from "./program-composition.types.js";

export const cohortDisplaySelect = {
  id: true,
  programId: true,
  name: true,
  capacity: true,
  startDate: true,
  endDate: true,
  _count: { select: { enrollments: true, waitlistEntries: true } },
} satisfies Prisma.ProgramCohortSelect;

export const courseDisplaySelect = {
  id: true,
  programId: true,
  courseVersionId: true,
  displayOrder: true,
  phaseNumber: true,
  isRequired: true,
  courseVersion: {
    select: {
      id: true,
      majorVersion: true,
      minorVersion: true,
      versionLabel: true,
      status: true,
      approvalStatus: true,
      isCurrent: true,
      estimatedDurationMinutes: true,
      course: { select: { id: true, code: true, title: true, thumbnailUrl: true, status: true } },
    },
  },
} satisfies Prisma.ProgramCourseSelect;

export const taskDisplaySelect = {
  id: true,
  programId: true,
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
  createdAt: true,
  updatedAt: true,
  taskType: {
    select: {
      id: true,
      name: true,
      slug: true,
      expectedSubmissionType: true,
      linkedEntity: true,
    },
  },
  courseVersion: {
    select: {
      id: true,
      majorVersion: true,
      minorVersion: true,
      course: { select: { id: true, title: true } },
    },
  },
  courseContent: { select: { id: true, title: true } },
  assessment: { select: { id: true, title: true, status: true } },
  liveSession: { select: { id: true, title: true, status: true, startTime: true, endTime: true } },
  survey: { select: { id: true, title: true, status: true } },
  _count: { select: { submissions: true } },
} satisfies Prisma.ProgramTaskSelect;

export const milestoneDisplaySelect = {
  id: true,
  programId: true,
  title: true,
  milestonePercentage: true,
  targetDate: true,
  targetOffsetDays: true,
  completionExpression: true,
  overdueAction: true,
  reminderOffsetsDays: true,
  _count: { select: { progresses: true } },
} satisfies Prisma.ProgramMilestoneSelect;

const audienceDisplaySelect = {
  id: true,
  audienceGroupId: true,
  audienceGroup: {
    select: { id: true, name: true, description: true, isActive: true },
  },
} satisfies Prisma.TargetAudienceSelect;

export class ProgramCompositionRepository {
  constructor(private readonly prisma: PrismaClient) { }

  transaction<T>(work: (tx: CompositionTransaction) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(work, { isolationLevel: "Serializable" });
  }

  findProgram(companyId: number, programId: number) {
    return this.prisma.learningProgram.findFirst({
      where: { id: programId, companyId, deletedAt: null },
      select: {
        id: true,
        companyId: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
      },
    });
  }

  listTargetAudiences(companyId: number, programId: number) {
    return this.prisma.targetAudience.findMany({
      where: { companyId, entityType: "LEARNING_PROGRAM", entityId: programId },
      select: audienceDisplaySelect,
      orderBy: { audienceGroup: { name: "asc" } },
    });
  }

  listCohorts(companyId: number, programId: number) {
    return this.prisma.programCohort.findMany({
      where: { companyId, programId },
      select: cohortDisplaySelect,
      orderBy: { name: "asc" },
    });
  }

  listCourses(companyId: number, programId: number) {
    return this.prisma.programCourse.findMany({
      where: { companyId, programId },
      select: courseDisplaySelect,
      orderBy: { displayOrder: "asc" },
    });
  }

  listTasks(companyId: number, programId: number) {
    return this.prisma.programTask.findMany({
      where: { companyId, programId, deletedAt: null },
      select: taskDisplaySelect,
      orderBy: { displayOrder: "asc" },
    });
  }

  listMilestones(companyId: number, programId: number) {
    return this.prisma.programMilestone.findMany({
      where: { companyId, programId },
      select: milestoneDisplaySelect,
      orderBy: { milestonePercentage: "asc" },
    });
  }
}
