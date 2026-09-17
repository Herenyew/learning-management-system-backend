import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import type {
  applyProgramTemplateSchema,
  programTemplateDefaultCoursesSchema,
  programTemplateDefaultMilestonesSchema,
  programTemplateDefaultTasksSchema,
  saveProgramAsTemplateSchema,
} from "./program-template-application.dto.js";

export type ProgramTemplateApplicationContext = {
  companyId: number;
  userId: number;
};

export type ProgramTemplateApplicationTransaction = Prisma.TransactionClient;
export type ApplyProgramTemplateInput = z.infer<typeof applyProgramTemplateSchema>;
export type SaveProgramAsTemplateInput = z.infer<typeof saveProgramAsTemplateSchema>;
export type ProgramTemplateDefaultCourse = z.infer<typeof programTemplateDefaultCoursesSchema>[number];
export type ProgramTemplateDefaultTask = z.infer<typeof programTemplateDefaultTasksSchema>[number];
export type ProgramTemplateDefaultMilestone = z.infer<typeof programTemplateDefaultMilestonesSchema>[number];

export type ProgramTemplateApplicationRepositoryPort = {
  transaction<T>(
    work: (tx: ProgramTemplateApplicationTransaction) => Promise<T>,
  ): Promise<T>;
};
