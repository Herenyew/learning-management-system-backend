import { Prisma, type PrismaClient } from "@prisma/client";

export type EnrollmentProgressTransaction = Prisma.TransactionClient;

const MAX_SERIALIZABLE_ATTEMPTS = 3;

export class EnrollmentProgressRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async transaction<T>(
    work: (tx: EnrollmentProgressTransaction) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 1; attempt <= MAX_SERIALIZABLE_ATTEMPTS; attempt += 1) {
      try {
        return await this.prisma.$transaction(work, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error) {
        const retryable =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
        if (!retryable || attempt === MAX_SERIALIZABLE_ATTEMPTS) throw error;
      }
    }
    throw new Error("Serializable progress transaction retry limit exceeded.");
  }

  findOwnedEnrollment(companyId: number, userId: number, enrollmentId: number) {
    return this.prisma.enrollment.findFirst({
      where: {
        id: enrollmentId,
        companyId,
        deletedAt: null,
        employee: { appUsers: { some: { id: userId, companyId } } },
      },
      include: {
        courseVersion: {
          include: {
            course: { select: { id: true, code: true, title: true, description: true } },
            assessments: {
              where: {
                status: "PUBLISHED",
                deletedAt: null,
                assessmentType: { isActive: true, isPractice: false, isGraded: true, isScored: true },
              },
              select: {
                id: true,
                title: true,
                passingScore: true,
                maxAttempts: true,
                durationMinutes: true,
                assessmentType: { select: { code: true, name: true } },
                attempts: {
                  where: { enrollmentId, companyId, deletedAt: null },
                  select: {
                    id: true,
                    attemptNo: true,
                    status: true,
                    percentage: true,
                    passed: true,
                    startedAt: true,
                    submittedAt: true,
                    gradedAt: true,
                  },
                  orderBy: { attemptNo: "desc" },
                },
              },
              orderBy: { id: "asc" },
            },
            chapters: {
              where: { status: "PUBLISHED", deletedAt: null },
              include: {
                contents: {
                  where: { deletedAt: null },
                  include: { contentType: { select: { slug: true, name: true, category: true } } },
                  orderBy: { displayOrder: "asc" },
                },
              },
              orderBy: { displayOrder: "asc" },
            },
          },
        },
        progress: { include: { lessonProgress: { orderBy: { contentId: "asc" } } } },
        completion: true,
      },
    });
  }

  listOwnedPrograms(companyId: number, userId: number) {
    return this.prisma.programEnrollment.findMany({
      where: {
        companyId,
        deletedAt: null,
        employee: { appUsers: { some: { id: userId, companyId } } },
      },
      select: {
        id: true,
        programId: true,
        cohortId: true,
        enrollmentNo: true,
        source: true,
        enrollmentStatus: true,
        progressPercentage: true,
        enrolledAt: true,
        startDate: true,
        dueDate: true,
        completedAt: true,
        program: { select: { id: true, name: true, description: true, status: true } },
        cohort: { select: { id: true, name: true, startDate: true, endDate: true } },
        enrollments: {
          where: { deletedAt: null },
          select: {
            id: true,
            courseVersionId: true,
            status: true,
            dueDate: true,
            completedAt: true,
            progress: { select: { overallProgress: true } },
            courseVersion: {
              select: { course: { select: { id: true, code: true, title: true } } },
            },
          },
          orderBy: { id: "asc" },
        },
        milestoneProgresses: {
          select: {
            id: true,
            status: true,
            achievedAt: true,
            milestone: { select: { id: true, title: true, milestonePercentage: true } },
          },
          orderBy: { milestone: { milestonePercentage: "asc" } },
        },
        completion: { select: { id: true, completedAt: true } },
      },
      orderBy: [{ enrolledAt: "desc" }, { id: "desc" }],
    });
  }

  listOwnedEnrollments(companyId: number, userId: number) {
    return this.prisma.enrollment.findMany({
      where: {
        companyId,
        deletedAt: null,
        employee: { appUsers: { some: { id: userId, companyId } } },
      },
      select: {
        id: true,
        courseVersionId: true,
        programEnrollmentId: true,
        enrollmentNo: true,
        status: true,
        enrolledAt: true,
        startedAt: true,
        dueDate: true,
        completedAt: true,
        courseVersion: {
          select: {
            id: true,
            majorVersion: true,
            minorVersion: true,
            course: { select: { id: true, code: true, title: true, description: true } },
          },
        },
        progress: {
          select: {
            overallProgress: true,
            completedLessons: true,
            totalLessons: true,
            completedAssessments: true,
            totalAssessments: true,
            totalLearningMinutes: true,
            lastAccessedAt: true,
            lastContentId: true,
          },
        },
        completion: { select: { id: true, finalScore: true, passed: true, completedAt: true } },
      },
      orderBy: [{ enrolledAt: "desc" }, { id: "desc" }],
    });
  }
}
