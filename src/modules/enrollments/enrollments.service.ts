import { generateCertificateNumber } from "../certificates/certificate-number.js";
import { certificatesRepository } from "../certificates/certificates.repository.js";
import { notificationDispatcher } from "../notifications/index.js";
import { enrollmentsRepository } from "./enrollments.repository.js";

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

        // Fetch the actual course title for the notification
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
  ) {
    const result = await enrollmentsRepository.transaction(
      async (transaction) => {
        const enrollment = await enrollmentsRepository.enrollProgram(
          transaction,
          {
            companyId: context.companyId,
            userId: context.userId,
            programId,
          },
        );

        // Fetch the actual program name for the notification
        const program = await transaction.learningProgram.findUnique({
          where: { id: enrollment.programId },
          select: { name: true },
        });
        const programTitle = program?.name ?? "Program";

        const dispatch = await notificationDispatcher.dispatch(transaction, {
          companyId: context.companyId,
          eventCode: "PROGRAM_ENROLLMENT_CONFIRMED",
          recipientUserIds: [context.userId],
          entityType: "PROGRAM_ENROLLMENT",
          entityId: String(enrollment.id),
          occurrenceKey: "enrolled",
          actionUrl: `/?screen=my-programs&programId=${programId}`,
          variables: { programTitle },
        });
        return { enrollment, dispatch };
      },
    );
    await notificationDispatcher.deliverAfterCommit(result.dispatch);
    return result.enrollment;
  },

  async completeCourse(
    context: { companyId: number; userId: number },
    input: {
      enrollmentId: number;
      finalScore?: number;
      passed?: boolean;
      certificateTemplateId?: number | null;
    },
  ) {
    const now = new Date();
    const result = await enrollmentsRepository.transaction(
      async (transaction) => {
        // Get enrollment with related data - note we only select IDs, the include will fetch relations
        const enrollment = await transaction.enrollment.findUniqueOrThrow({
          where: { id: input.enrollmentId },
          include: {
            employee: {
              select: {
                appUsers: {
                  where: { id: context.userId },
                  select: { id: true },
                  take: 1,
                },
              },
            },
            courseVersion: {
              select: {
                id: true,
                courseId: true,
                course: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        });

        // Verify user owns this enrollment
        if (enrollment.employee.appUsers.length === 0) {
          throw new Error("Enrollment does not belong to the current user.");
        }

        // Check if already completed
        const existingCompletion = await transaction.courseCompletion.findFirst({
          where: { enrollmentId: enrollment.id },
          include: {
            certificate: {
              include: {
                template: { select: { id: true, name: true } },
              },
            },
          },
        });

        if (existingCompletion) {
          // Already completed - return existing data
          return {
            enrollment,
            completion: existingCompletion,
            certificate: existingCompletion.certificate,
            programCompletions: [],
            dispatches: [],
          };
        }

        // Create completion record
        const completion = await transaction.courseCompletion.create({
          data: {
            companyId: context.companyId,
            enrollmentId: enrollment.id,
            completedAt: now,
            finalScore: input.finalScore ?? 0,
            passed: input.passed ?? true,
            completionSnapshot: {},
          },
        });

        // Update enrollment status
        await transaction.enrollment.update({
          where: { id: enrollment.id },
          data: { status: "COMPLETED", completedAt: now, updatedAt: now },
        });

        // Issue certificate if template is provided
        let certificate = null;
        const dispatches = [];

        if (input.certificateTemplateId) {
          certificate = await certificatesRepository.issueForCourseCompletion(
            transaction,
            {
              companyId: context.companyId,
              userId: context.userId,
              enrollmentId: enrollment.id,
              certificateNumber: generateCertificateNumber(),
              templateId: input.certificateTemplateId,
            },
          );

          // Send certificate notification
          const certDispatch = await notificationDispatcher.dispatch(transaction, {
            companyId: context.companyId,
            eventCode: "CERTIFICATE_ISSUED",
            recipientUserIds: [context.userId],
            entityType: "CERTIFICATE",
            entityId: String(certificate.id),
            occurrenceKey: "issued",
            actionUrl: `/?screen=my-certificates&certificateId=${certificate.id}`,
            variables: {
              certificateName: enrollment.courseVersion.course.title,
              certificateNumber: certificate.certificateNumber,
            },
          });
          dispatches.push(certDispatch);
        }

        // Check for related program enrollments
        const programEnrollments = await transaction.programEnrollment.findMany({
          where: {
            companyId: context.companyId,
            employeeId: enrollment.employeeId,
            enrollmentStatus: "ACTIVE",
            program: {
              courses: {
                some: {
                  courseVersionId: enrollment.courseVersionId,
                },
              },
            },
          },
          include: {
            program: {
              include: {
                courses: {
                  select: { courseVersionId: true },
                },
              },
            },
          },
        });

        const programCompletions = [];

        for (const programEnrollment of programEnrollments) {
          const requiredCourseVersionIds = programEnrollment.program.courses.map(
            (c) => c.courseVersionId,
          );

          if (requiredCourseVersionIds.length === 0) continue;

          // Count completed courses
          const completedCount = await transaction.courseCompletion.count({
            where: {
              companyId: context.companyId,
              enrollment: {
                employeeId: enrollment.employeeId,
                courseVersionId: { in: requiredCourseVersionIds },
              },
            },
          });

          const progressPct = Number(
            ((completedCount / requiredCourseVersionIds.length) * 100).toFixed(2),
          );

          // Update program progress
          await transaction.programEnrollment.update({
            where: { id: programEnrollment.id },
            data: { progressPercentage: progressPct },
          });

          // Check if program is now complete
          if (completedCount === requiredCourseVersionIds.length) {
            // Check if completion record already exists
            const existingProgramCompletion = await transaction.programCompletion.findFirst({
              where: { programEnrollmentId: programEnrollment.id },
            });

            if (!existingProgramCompletion) {
              // Create program completion
              const programCompletion = await transaction.programCompletion.create({
                data: {
                  companyId: context.companyId,
                  programEnrollmentId: programEnrollment.id,
                  completedAt: now,
                  completionSnapshot: {},
                },
              });

              // Update program enrollment status
              await transaction.programEnrollment.update({
                where: { id: programEnrollment.id },
                data: {
                  enrollmentStatus: "COMPLETED",
                  completedAt: now,
                },
              });

              // Program certificate issuance would go here
              // For now, we skip it since your schema doesn't have a default template configuration

              programCompletions.push({
                enrollment: programEnrollment,
                completion: programCompletion,
                certificate: null,
              });
            }
          }
        }

        return { enrollment, completion, certificate, programCompletions, dispatches };
      },
    );

    // Deliver notifications after transaction commits
    await Promise.all(
      result.dispatches.map((dispatch) =>
        notificationDispatcher.deliverAfterCommit(dispatch),
      ),
    );

    return {
      enrollment: result.enrollment,
      completion: result.completion,
      certificate: result.certificate,
      programCompletions: result.programCompletions,
    };
  },
};
