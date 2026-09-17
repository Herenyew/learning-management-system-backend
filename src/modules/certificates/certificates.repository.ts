import type { Prisma } from "@prisma/client";
import { getPrismaClient } from "../../config/database.js";

export type CertificateTransaction = Prisma.TransactionClient;

export const certificatesRepository = {
  transaction<T>(
    operation: (transaction: CertificateTransaction) => Promise<T>,
  ) {
    return getPrismaClient().$transaction(operation);
  },

  async findIssueContext(
    transaction: CertificateTransaction,
    input: {
      companyId: number;
      userId: number;
      templateId?: number | null;
      courseId?: number | null;
      programId?: number | null;
    },
  ) {
    const [user, template] = await Promise.all([
      transaction.appUser.findFirstOrThrow({
        where: {
          id: input.userId,
          companyId: input.companyId,
          isActive: true,
        },
        select: { id: true, email: true },
      }),
      input.templateId
        ? transaction.certificateTemplate.findFirstOrThrow({
          where: { id: input.templateId, companyId: input.companyId },
          select: { id: true, name: true },
        })
        : null,
    ]);
    return { user, template };
  },

  async issue(
    transaction: CertificateTransaction,
    input: {
      companyId: number;
      userId: number;
      issuedByUserId?: number | null;
      certificateNumber: string;
      templateId: number;
      completionId?: number | null;
      programCompletionId?: number | null;
      expiresAt?: Date | null;
    },
  ) {
    const cert = await transaction.certificate.create({
      data: {
        companyId: input.companyId,
        issuanceType: input.completionId
          ? "COURSE_COMPLETION"
          : input.programCompletionId
            ? "PROGRAM_COMPLETION"
            : "MANUAL",
        completionId: input.completionId ?? null,
        programCompletionId: input.programCompletionId ?? null,
        templateId: input.templateId,
        certificateNumber: input.certificateNumber,
        issuedAt: new Date(),
        expiresAt: input.expiresAt ?? null,
        verificationCode: input.certificateNumber,
        status: "ACTIVE",
        manualIssuedByUserId: input.issuedByUserId ?? null,
      },
      include: {
        template: { select: { id: true, name: true } },
      },
    });
    return cert;
  },

  async issueForCourseCompletion(
    transaction: CertificateTransaction,
    input: {
      companyId: number;
      userId: number;
      enrollmentId: number;
      certificateNumber: string;
      templateId: number;
    },
  ) {
    // Check if certificate already issued for this enrollment's completion
    const existing = await transaction.certificate.findFirst({
      where: {
        completion: { enrollmentId: input.enrollmentId },
      },
      include: {
        template: { select: { id: true, name: true } },
        completion: {
          select: {
            enrollment: {
              select: {
                courseVersion: {
                  select: {
                    course: { select: { id: true, title: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (existing) return existing;

    // Get completion record
    const completion = await transaction.courseCompletion.findFirstOrThrow({
      where: { enrollmentId: input.enrollmentId },
      select: { id: true },
    });

    return transaction.certificate.create({
      data: {
        companyId: input.companyId,
        issuanceType: "COURSE_COMPLETION",
        completionId: completion.id,
        templateId: input.templateId,
        certificateNumber: input.certificateNumber,
        issuedAt: new Date(),
        verificationCode: input.certificateNumber,
        status: "ACTIVE",
      },
      include: {
        template: { select: { id: true, name: true } },
        completion: {
          select: {
            enrollment: {
              select: {
                courseVersion: {
                  select: {
                    course: { select: { id: true, title: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
  },

  async issueForProgramCompletion(
    transaction: CertificateTransaction,
    input: {
      companyId: number;
      userId: number;
      programEnrollmentId: number;
      certificateNumber: string;
      templateId: number;
      expiresAt?: Date | null;
    },
  ) {
    // Check if certificate already issued for this program enrollment's completion
    const existing = await transaction.certificate.findFirst({
      where: {
        programCompletion: { programEnrollmentId: input.programEnrollmentId },
      },
      include: {
        template: { select: { id: true, name: true } },
        programCompletion: {
          select: {
            programEnrollment: {
              select: {
                program: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });
    if (existing) return existing;

    // Get program completion record
    const programCompletion = await transaction.programCompletion.findFirstOrThrow({
      where: { programEnrollmentId: input.programEnrollmentId },
      select: { id: true },
    });

    return transaction.certificate.create({
      data: {
        companyId: input.companyId,
        issuanceType: "PROGRAM_COMPLETION",
        programCompletionId: programCompletion.id,
        templateId: input.templateId,
        certificateNumber: input.certificateNumber,
        issuedAt: new Date(),
        expiresAt: input.expiresAt ?? null,
        verificationCode: input.certificateNumber,
        status: "ACTIVE",
      },
      include: {
        template: { select: { id: true, name: true } },
        programCompletion: {
          select: {
            programEnrollment: {
              select: {
                program: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });
  },

  listOwn(companyId: number, userId: number) {
    return getPrismaClient().certificate.findMany({
      where: {
        companyId,
        OR: [
          { manualRecipientEmployee: { appUsers: { some: { id: userId, companyId } } } },
          {
            completion: {
              enrollment: {
                companyId,
                employee: { appUsers: { some: { id: userId, companyId } } },
              },
            },
          },
          {
            programCompletion: {
              programEnrollment: {
                companyId,
                employee: { appUsers: { some: { id: userId, companyId } } },
              },
            },
          },
        ],
      },
      include: {
        template: { select: { id: true, name: true } },
      },
      orderBy: { issuedAt: "desc" },
    });
  },

  async listActiveCompanyIds() {
    const companies = await getPrismaClient().company.findMany({
      where: { isActive: true },
      select: { id: true },
      orderBy: { id: "asc" },
    });
    return companies.map((company) => company.id);
  },

  findExpiring(
    transaction: CertificateTransaction,
    companyId: number,
    start: Date,
    end: Date,
  ) {
    return transaction.certificate.findMany({
      where: {
        companyId,
        status: "ACTIVE",
        expiresAt: { gte: start, lt: end },
      },
      include: {
        template: { select: { name: true } },
        completion: {
          select: {
            enrollment: {
              select: {
                employee: {
                  select: {
                    appUsers: { select: { id: true }, take: 1 },
                  },
                },
              },
            },
          },
        },
        programCompletion: {
          select: {
            programEnrollment: {
              select: {
                employee: {
                  select: {
                    appUsers: { select: { id: true }, take: 1 },
                  },
                },
              },
            },
          },
        },
        manualRecipientEmployee: {
          select: { appUsers: { select: { id: true }, take: 1 } },
        },
      },
      orderBy: { expiresAt: "asc" },
    });
  },
};
