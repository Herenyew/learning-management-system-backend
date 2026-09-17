import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import type {
  bulkProgramCohortEnrollmentSchema,
  createProgramCohortEnrollmentSchema,
  joinProgramCohortWaitlistSchema,
} from "./program-cohort-roster.dto.js";

export type ProgramCohortRosterContext = {
  companyId: number;
  userId: number;
};

export type ProgramCohortRosterTransaction = Prisma.TransactionClient;
export type CreateProgramCohortEnrollmentInput = z.infer<
  typeof createProgramCohortEnrollmentSchema
>;
export type BulkProgramCohortEnrollmentInput = z.infer<
  typeof bulkProgramCohortEnrollmentSchema
>;
export type JoinProgramCohortWaitlistInput = z.infer<
  typeof joinProgramCohortWaitlistSchema
>;

export type ProgramCohortBulkOutcome =
  | {
      employeeId: string;
      status: "enrolled";
      enrollmentId: number;
      linkedCourseEnrollmentIds: number[];
    }
  | {
      employeeId: string;
      status: "conflict" | "capacity";
      message: string;
    };
