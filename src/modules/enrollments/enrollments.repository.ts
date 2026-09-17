import type { Prisma } from "@prisma/client";
import { getPrismaClient } from "../../config/database.js";

export type EnrollmentTransaction = Prisma.TransactionClient;

export const enrollmentsRepository = {
  transaction<T>(
    operation: (transaction: EnrollmentTransaction) => Promise<T>,
  ) {
    return getPrismaClient().$transaction(operation);
  },

  async enrollCourse(
    transaction: EnrollmentTransaction,
    input: { companyId: number; userId: number; courseId: number },
  ) {
    const [appUser] = await Promise.all([
      transaction.appUser.findFirstOrThrow({
        where: { id: input.userId, companyId: input.companyId },
        select: { employeeId: true },
      }),
      transaction.courseVersion.findFirstOrThrow({
        where: {
          id: input.courseId,
          companyId: input.companyId,
          status: "PUBLISHED",
          approvalStatus: "APPROVED",
          deletedAt: null,
        },
        select: { id: true },
      }),
    ]);

    if (!appUser.employeeId) {
      throw new Error("User has no associated employee ID.");
    }

    const existing = await transaction.enrollment.findFirst({
      where: {
        companyId: input.companyId,
        employeeId: appUser.employeeId,
        courseVersionId: input.courseId,
        deletedAt: null,
        status: { in: ["PENDING", "WAITLISTED", "ACTIVE", "COMPLETED"] },
      },
    });
    if (existing) return existing;
    const latestAttempt = await transaction.enrollment.aggregate({
      where: {
        employeeId: appUser.employeeId,
        courseVersionId: input.courseId,
      },
      _max: { enrollmentNo: true },
    });

    return transaction.enrollment.create({
      data: {
        companyId: input.companyId,
        employeeId: appUser.employeeId,
        courseVersionId: input.courseId,
        enrollmentNo: (latestAttempt._max.enrollmentNo ?? 0) + 1,
        enrollmentType: "STANDARD",
        enrollmentSource: "SELF_SERVICE",
        status: "ACTIVE",
        enrolledAt: new Date(),
      },
    });
  },
};
