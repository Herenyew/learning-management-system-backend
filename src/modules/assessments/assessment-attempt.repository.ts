import { Prisma, type PrismaClient } from "@prisma/client";

export type AssessmentAttemptTransaction = Prisma.TransactionClient;

const MAX_SERIALIZABLE_ATTEMPTS = 3;

export class AssessmentAttemptRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async transaction<T>(
    work: (tx: AssessmentAttemptTransaction) => Promise<T>,
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
    throw new Error("Serializable assessment-attempt transaction retry limit exceeded.");
  }
}
