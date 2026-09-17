import prisma from "../../config/database.js";
import { notificationDispatcher } from "../notifications/index.js";
import { ProgramCohortRosterRepository } from "../program/program-cohort-roster.repository.js";
import { ProgramCohortRosterService } from "../program/program-cohort-roster.service.js";
import { enrollmentsRepository } from "./enrollments.repository.js";

const programEnrollmentService = new ProgramCohortRosterService(
  new ProgramCohortRosterRepository(prisma),
);

export const enrollmentsService = {
  async enrollCourse(
    context: { companyId: number; userId: number },
    courseId: number,
  ) {
    const result = await enrollmentsRepository.transaction(
      async (transaction) => {
        const enrollment = await enrollmentsRepository.enrollCourse(
          transaction,
          {
            companyId: context.companyId,
            userId: context.userId,
            courseId,
          },
        );

        const courseVersion = await transaction.courseVersion.findUnique({
          where: { id: enrollment.courseVersionId },
          select: { course: { select: { title: true } } },
        });
        const courseTitle = courseVersion?.course.title ?? "Course";

        const dispatch = await notificationDispatcher.dispatch(transaction, {
          companyId: context.companyId,
          eventCode: "COURSE_ENROLLMENT_CONFIRMED",
          recipientUserIds: [context.userId],
          entityType: "COURSE_ENROLLMENT",
          entityId: String(enrollment.id),
          occurrenceKey: "enrolled",
          actionUrl: `/?screen=my-courses&courseId=${courseId}`,
          variables: { courseTitle },
        });
        return { enrollment, dispatch };
      },
    );
    await notificationDispatcher.deliverAfterCommit(result.dispatch);
    return result.enrollment;
  },

  async enrollProgram(
    context: { companyId: number; userId: number },
    programId: number,
    cohortId: number,
  ) {
    return programEnrollmentService.enrollCurrentUser(
      context,
      programId,
      cohortId,
      "API",
    );
  },
};
