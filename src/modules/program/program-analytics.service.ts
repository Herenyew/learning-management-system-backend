import type { PrismaClient } from "@prisma/client";

const pct = (value: number) => Number(value.toFixed(2));

export class ProgramAnalyticsService {
  constructor(private readonly prisma: PrismaClient) {}

  async runtime(companyId: number, now = new Date()) {
    const programs = await this.prisma.learningProgram.findMany({
      where: { companyId, deletedAt: null, status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        status: true,
        cohorts: { select: { id: true, name: true } },
        enrollments: {
          where: { companyId, deletedAt: null },
          select: {
            id: true,
            employeeId: true,
            cohortId: true,
            enrollmentStatus: true,
            progressPercentage: true,
            enrolledAt: true,
            dueDate: true,
          },
        },
        tasks: {
          where: { deletedAt: null, OR: [{ isRequired: true }, { isBlocking: true }] },
          select: {
            id: true,
            dueDate: true,
            dueOffsetDays: true,
            progresses: {
              where: { companyId, status: { in: ["COMPLETED", "WAIVED"] } },
              select: { programEnrollmentId: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const rows = programs.map((program) => {
      const enrolled = program.enrollments.length;
      const completed = program.enrollments.filter(
        (item) => item.enrollmentStatus === "COMPLETED",
      ).length;
      const progress =
        enrolled === 0
          ? 0
          : pct(
              program.enrollments.reduce(
                (sum, item) => sum + Number(item.progressPercentage),
                0,
              ) / enrolled,
            );
      let overdue = program.enrollments.filter(
        (item) =>
          item.enrollmentStatus === "ACTIVE" &&
          item.dueDate != null &&
          item.dueDate.getTime() < now.getTime(),
      ).length;
      for (const task of program.tasks) {
        const completedEnrollmentIds = new Set(
          task.progresses.map((item) => item.programEnrollmentId),
        );
        for (const enrollment of program.enrollments) {
          if (enrollment.enrollmentStatus !== "ACTIVE" || completedEnrollmentIds.has(enrollment.id)) {
            continue;
          }
          const dueAt = task.dueDate ??
            (task.dueOffsetDays == null
              ? null
              : new Date(enrollment.enrolledAt.getTime() + task.dueOffsetDays * 86_400_000));
          if (dueAt && dueAt.getTime() < now.getTime()) overdue += 1;
        }
      }
      const cohorts = program.cohorts.map((cohort) => {
        const members = program.enrollments.filter((item) => item.cohortId === cohort.id);
        return {
          id: cohort.id,
          name: cohort.name,
          learners: members.length,
          completed: members.filter((item) => item.enrollmentStatus === "COMPLETED").length,
          progress:
            members.length === 0
              ? 0
              : pct(
                  members.reduce((sum, item) => sum + Number(item.progressPercentage), 0) /
                    members.length,
                ),
        };
      });
      return {
        id: program.id,
        name: program.name,
        status: program.status,
        enrolled,
        completed,
        overdue,
        progress,
        cohorts: program.cohorts.length,
        cohortPerformance: cohorts,
      };
    });

    const totalEnrolled = rows.reduce((sum, row) => sum + row.enrolled, 0);
    const totalCompleted = rows.reduce((sum, row) => sum + row.completed, 0);
    return {
      generatedAt: now.toISOString(),
      summary: {
        activePrograms: rows.length,
        totalEnrolled,
        totalCompleted,
        completionRate: totalEnrolled === 0 ? 0 : pct((totalCompleted / totalEnrolled) * 100),
        averageProgress:
          totalEnrolled === 0
            ? 0
            : pct(rows.reduce((sum, row) => sum + row.progress * row.enrolled, 0) / totalEnrolled),
        overdueRequirements: rows.reduce((sum, row) => sum + row.overdue, 0),
      },
      programs: rows,
    };
  }
}
