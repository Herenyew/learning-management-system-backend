import { roleProfileFromName } from "../../common/constants/access-control-permission.constant.js";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../common/errors/http-errors.js";
import { calculateDurationDays } from "./program-details.dto.js";
import type {
  CreateProgramInput,
  DuplicateProgramInput,
  ProgramDetailsRepositoryPort,
  ProgramListQuery,
  ProgramMutationState,
  ProgramOwner,
  UpdateProgramInput,
} from "./program-details.types.js";

const isHrEligible = (owner: ProgramOwner): boolean => {
  const roleNames = owner.appUsers.flatMap((user) => [
    ...(user.role?.isActive ? [user.role.name] : []),
    ...(user.primaryEmRole?.isActive ? [user.primaryEmRole.name] : []),
    ...user.roleAssignments
      .filter((assignment) => assignment.appRole.isActive)
      .map((assignment) => assignment.appRole.name),
  ]);

  return roleNames.some((name) => {
    const profile = roleProfileFromName(name);
    return profile === "hr" || profile === "admin";
  });
};

const duplicateName = (sourceName: string, sequence: number): string => {
  const suffix = sequence === 1 ? " (Copy)" : ` (Copy ${sequence})`;
  return `${sourceName.slice(0, 255 - suffix.length)}${suffix}`;
};

export class ProgramDetailsService {
  constructor(private readonly repository: ProgramDetailsRepositoryPort) { }

  async create(companyId: number, userId: number, data: CreateProgramInput) {
    const [duplicate, programType, programCategory, owner] = await Promise.all([
      this.repository.findByName(companyId, data.name),
      this.repository.findProgramType(companyId, data.programTypeId),
      data.programCategoryId
        ? this.repository.findProgramCategory(companyId, data.programCategoryId)
        : Promise.resolve(null),
      this.repository.findOwner(companyId, data.ownerEmployeeId),
    ]);

    if (duplicate) {
      throw new ConflictError(`A program named '${data.name}' already exists in this company.`);
    }
    if (!programType?.isActive) {
      throw new ValidationError("Program type must be active and belong to the authenticated company.");
    }
    if (data.programCategoryId && !programCategory?.isActive) {
      throw new ValidationError("Program category must be active and belong to the authenticated company.");
    }
    if (!owner?.isActive) {
      throw new ValidationError("Owner employee must be active and belong to the authenticated company.");
    }
    if (!isHrEligible(owner)) {
      throw new ValidationError("Owner employee must have an active HR or administrator role.");
    }

    const durationDays =
      data.startDate && data.endDate
        ? calculateDurationDays(data.startDate, data.endDate)
        : null;

    return this.repository.create(companyId, userId, data, durationDays);
  }

  private async validateReferences(
    companyId: number,
    data: Pick<CreateProgramInput, "programTypeId" | "programCategoryId" | "ownerEmployeeId">,
  ) {
    const [programType, programCategory, owner] = await Promise.all([
      this.repository.findProgramType(companyId, data.programTypeId),
      data.programCategoryId
        ? this.repository.findProgramCategory(companyId, data.programCategoryId)
        : Promise.resolve(null),
      this.repository.findOwner(companyId, data.ownerEmployeeId),
    ]);

    if (!programType?.isActive) {
      throw new ValidationError("Program type must be active and belong to the authenticated company.");
    }
    if (data.programCategoryId && !programCategory?.isActive) {
      throw new ValidationError("Program category must be active and belong to the authenticated company.");
    }
    if (!owner?.isActive) {
      throw new ValidationError("Owner employee must be active and belong to the authenticated company.");
    }
    if (!isHrEligible(owner)) {
      throw new ValidationError("Owner employee must have an active HR or administrator role.");
    }
  }

  async listOwners(companyId: number) {
    const owners = await this.repository.listOwners(companyId);
    return owners.filter(isHrEligible).map((owner) => ({
      id: owner.id,
      name: owner.fullName,
      email: owner.appUsers[0]?.email ?? "",
    }));
  }

  async list(companyId: number, query: ProgramListQuery) {
    const result = await this.repository.list(companyId, query);
    return {
      ...result,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(result.total / query.pageSize),
    };
  }

  async getById(companyId: number, id: number) {
    const program = await this.repository.findById(companyId, id);
    if (!program) {
      throw new NotFoundError("Learning program");
    }
    return program;
  }

  async update(companyId: number, userId: number, id: number, data: UpdateProgramInput) {
    const existing = await this.requireMutationState(companyId, id);
    if (existing.status !== "DRAFT") {
      throw new ConflictError("Only draft learning programs can be updated.");
    }
    if (await this.repository.hasPendingApproval(companyId, id)) {
      throw new ConflictError("A learning program with a pending approval instance cannot be updated.");
    }

    if (data.name !== undefined) {
      const duplicate = await this.repository.findByName(companyId, data.name, id);
      if (duplicate) {
        throw new ConflictError(`A program named '${data.name}' already exists in this company.`);
      }
    }

    await this.validateReferences(companyId, {
      programTypeId: data.programTypeId ?? existing.programTypeId,
      programCategoryId:
        data.programCategoryId === undefined
          ? existing.programCategoryId
          : data.programCategoryId,
      ownerEmployeeId: data.ownerEmployeeId ?? existing.ownerEmployeeId,
    });

    const startDate = data.startDate === undefined ? existing.startDate : data.startDate;
    const endDate = data.endDate === undefined ? existing.endDate : data.endDate;
    if ((data.startDate !== undefined || data.endDate !== undefined) && startDate && endDate) {
      if (endDate.getTime() <= startDate.getTime()) {
        throw new ValidationError("End date must be after start date.");
      }
    }
    const durationDays = startDate && endDate ? calculateDurationDays(startDate, endDate) : null;

    return this.repository.update(companyId, userId, id, data, durationDays);
  }

  async archive(companyId: number, userId: number, id: number) {
    const existing = await this.requireMutationState(companyId, id);
    if (existing.status === "ARCHIVED") {
      throw new ConflictError("Learning program is already archived.");
    }
    if (await this.repository.hasPendingApproval(companyId, id)) {
      throw new ConflictError("A learning program with a pending approval instance cannot be archived.");
    }
    if (await this.repository.countActiveEnrollments(companyId, id)) {
      throw new ConflictError("A learning program with active enrollments cannot be archived.");
    }
    return this.repository.archive(companyId, userId, id);
  }

  async restore(companyId: number, userId: number, id: number) {
    const existing = await this.requireMutationState(companyId, id);
    if (existing.status !== "ARCHIVED") {
      throw new ConflictError("Only archived learning programs can be restored.");
    }
    return this.repository.restore(companyId, userId, id);
  }

  async duplicate(
    companyId: number,
    userId: number,
    id: number,
    data: DuplicateProgramInput,
  ) {
    const source = await this.requireMutationState(companyId, id);
    let name = data.name;

    if (name) {
      if (await this.repository.findByName(companyId, name)) {
        throw new ConflictError(`A program named '${name}' already exists in this company.`);
      }
    } else {
      for (let sequence = 1; sequence <= 10_000; sequence += 1) {
        const candidate = duplicateName(source.name, sequence);
        if (!(await this.repository.findByName(companyId, candidate))) {
          name = candidate;
          break;
        }
      }
      if (!name) {
        throw new ConflictError("Could not generate a unique name for the duplicated program.");
      }
    }

    return this.repository.duplicate(companyId, userId, id, name);
  }

  async auditHistory(companyId: number, id: number) {
    await this.requireMutationState(companyId, id);
    return this.repository.auditHistory(companyId, id);
  }

  private async requireMutationState(companyId: number, id: number): Promise<ProgramMutationState> {
    const program = await this.repository.findMutationState(companyId, id);
    if (!program) {
      throw new NotFoundError("Learning program");
    }
    return program;
  }
}
