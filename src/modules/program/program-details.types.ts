import type { z } from "zod";
import type {
  createProgramSchema,
  duplicateProgramSchema,
  programListQuerySchema,
  updateProgramSchema,
} from "./program-details.dto.js";

export type CreateProgramInput = z.infer<typeof createProgramSchema>;
export type UpdateProgramInput = z.infer<typeof updateProgramSchema>;
export type DuplicateProgramInput = z.infer<typeof duplicateProgramSchema>;
export type ProgramListQuery = z.infer<typeof programListQuerySchema>;

export interface ActiveReference {
  id: number;
  isActive: boolean;
}

export interface OwnerRole {
  name: string;
  isActive: boolean;
}

export interface ProgramOwner {
  id: string;
  fullName: string;
  isActive: boolean;
  appUsers: Array<{
    email: string;
    role: OwnerRole | null;
    primaryEmRole: OwnerRole | null;
    roleAssignments: Array<{ appRole: OwnerRole }>;
  }>;
}

export interface ProgramMutationState {
  id: number;
  name: string;
  description: string | null;
  programTypeId: number;
  programCategoryId: number | null;
  ownerEmployeeId: string;
  visibility: "PUBLIC" | "COMPANY" | "ENROLLED_ONLY" | "INVITATION_ONLY";
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  startDate: Date | null;
  endDate: Date | null;
  durationDays: number | null;
  rollingEnrollment: boolean;
  maxEnrollments: number | null;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
}

export interface ProgramDetailsRepositoryPort {
  findByName(companyId: number, name: string, excludeId?: number): Promise<{ id: number } | null>;
  findProgramType(companyId: number, id: number): Promise<ActiveReference | null>;
  findProgramCategory(companyId: number, id: number): Promise<ActiveReference | null>;
  findOwner(companyId: number, employeeId: string): Promise<ProgramOwner | null>;
  listOwners(companyId: number): Promise<ProgramOwner[]>;
  create(companyId: number, userId: number, data: CreateProgramInput, durationDays: number | null): Promise<unknown>;
  list(companyId: number, query: ProgramListQuery): Promise<{ items: unknown[]; total: number }>;
  findById(companyId: number, id: number): Promise<unknown | null>;
  findMutationState(companyId: number, id: number): Promise<ProgramMutationState | null>;
  hasPendingApproval(companyId: number, id: number): Promise<boolean>;
  countActiveEnrollments(companyId: number, id: number): Promise<number>;
  update(
    companyId: number,
    userId: number,
    id: number,
    data: UpdateProgramInput,
    durationDays: number | null,
  ): Promise<unknown>;
  archive(companyId: number, userId: number, id: number): Promise<unknown>;
  restore(companyId: number, userId: number, id: number): Promise<unknown>;
  duplicate(
    companyId: number,
    userId: number,
    sourceId: number,
    name: string,
  ): Promise<unknown>;
  auditHistory(companyId: number, id: number): Promise<unknown>;
}
