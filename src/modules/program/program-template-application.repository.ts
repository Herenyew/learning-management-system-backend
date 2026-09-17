import type { PrismaClient } from "@prisma/client";
import type {
  ProgramTemplateApplicationRepositoryPort,
  ProgramTemplateApplicationTransaction,
} from "./program-template-application.types.js";

export class ProgramTemplateApplicationRepository
  implements ProgramTemplateApplicationRepositoryPort {
  constructor(private readonly prisma: PrismaClient) { }

  transaction<T>(
    work: (tx: ProgramTemplateApplicationTransaction) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(work, { isolationLevel: "Serializable" });
  }
}
