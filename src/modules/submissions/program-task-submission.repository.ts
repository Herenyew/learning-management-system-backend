import { Prisma, type PrismaClient } from "@prisma/client";

export type ProgramTaskSubmissionTransaction = Prisma.TransactionClient;
const MAX_SERIALIZABLE_ATTEMPTS = 3;

export class ProgramTaskSubmissionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async transaction<T>(
    work: (tx: ProgramTaskSubmissionTransaction) => Promise<T>,
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
    throw new Error("Serializable task-submission transaction retry limit exceeded.");
  }
}
