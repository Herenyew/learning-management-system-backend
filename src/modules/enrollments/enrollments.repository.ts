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
    const appUser = await transaction.appUser.findFirstOrThrow({
      where: { id: input.userId, companyId: input.companyId },
      select: { employeeId: true },
    });

    if (!appUser.employeeId) {
      throw new Error("User has no associated employee ID.");
    }

    const existing = await transaction.enrollment.findFirst({
      where: {
        companyId: input.companyId,
        employeeId: appUser.employeeId,
        courseVersionId: input.courseId,
      },
    });
    if (existing) return existing;

    return transaction.enrollment.create({
      data: {
        companyId: input.companyId,
        employeeId: appUser.employeeId,
        courseVersionId: input.courseId,
        enrollmentType: "STANDARD",
        enrollmentSource: "SELF_SERVICE",
        status: "ACTIVE",
        enrolledAt: new Date(),
      },
    });
  },

  async enrollProgram(
    transaction: EnrollmentTransaction,
    input: { companyId: number; userId: number; programId: number },
  ) {
    const appUser = await transaction.appUser.findFirstOrThrow({
      where: { id: input.userId, companyId: input.companyId },
      select: { employeeId: true },
    });

    if (!appUser.employeeId) {
      throw new Error("User has no associated employee ID.");
    }

    const existing = await transaction.programEnrollment.findFirst({
      where: {
        companyId: input.companyId,
        employeeId: appUser.employeeId,
        programId: input.programId,
      },
    });
    if (existing) return existing;

    return transaction.programEnrollment.create({
      data: {
        companyId: input.companyId,
        employeeId: appUser.employeeId,
        programId: input.programId,
        enrollmentStatus: "ACTIVE",
        enrolledAt: new Date(),
      },
    });
  },
};
