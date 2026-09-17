import { Prisma, type PrismaClient } from "@prisma/client";

export type AttendanceTransaction = Prisma.TransactionClient;
const MAX_SERIALIZABLE_ATTEMPTS = 3;

export class LiveSessionAttendanceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async transaction<T>(work: (tx: AttendanceTransaction) => Promise<T>): Promise<T> {
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
    throw new Error("Serializable attendance transaction retry limit exceeded.");
  }
}
