import type { AudienceGroup, AudienceGroupRule } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { ConflictError, NotFoundError } from "../../../common/errors/http-errors.js";
import { buildPaginationMeta } from "../../../common/http/pagination.js";
import type {
  AudienceGroupFilterParams,
  AudienceGroupWithRules,
  CreateAudienceGroupInput,
  CreateAudienceGroupRuleInput,
  IAudienceRepository,
  UpdateAudienceGroupInput,
  UpdateAudienceGroupRuleInput,
} from "./audience.types.js";

export class AudienceService {
  constructor(private readonly audienceRepository: IAudienceRepository) {}

  // ==========================================
  // Audience Groups
  // ==========================================

  async create(
    companyId: number,
    createdBy: number,
    dto: CreateAudienceGroupInput,
  ): Promise<AudienceGroup> {
    const existing = await this.audienceRepository.findByName(companyId, dto.name);
    if (existing) {
      throw new ConflictError("Audience group already exists.");
    }

    return this.audienceRepository.create(companyId, createdBy, dto);
  }

  async findById(companyId: number, audienceGroupId: number): Promise<AudienceGroupWithRules> {
    const group = await this.audienceRepository.findById(audienceGroupId, companyId);
    if (!group) {
      throw new NotFoundError("Audience group");
    }
    return group;
  }

  async findMany(companyId: number, filter: AudienceGroupFilterParams) {
    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 10;

    const [data, totalRecords] = await Promise.all([
      this.audienceRepository.findMany(companyId, filter),
      this.audienceRepository.countMany(companyId, filter),
    ]);

    return {
      data,
      pagination: buildPaginationMeta(page, pageSize, totalRecords),
    };
  }

  async update(
    companyId: number,
    audienceGroupId: number,
    updatedBy: number,
    dto: UpdateAudienceGroupInput,
  ): Promise<AudienceGroup> {
    const group = await this.findById(companyId, audienceGroupId);

    if (dto.name && dto.name !== group.name) {
      const existing = await this.audienceRepository.findByName(companyId, dto.name);
      if (existing) {
        throw new ConflictError("Audience group already exists.");
      }
    }

    // Guard deactivation if the group is actively bound to targets.
    if (dto.isActive === false && group.isActive === true) {
      const usages = await this.audienceRepository.findTargetUsages(audienceGroupId, companyId);
      if (usages.length > 0) {
        throw new ConflictError(
          `Cannot deactivate: this group is active in ${usages.length} target assignment${
            usages.length === 1 ? "" : "s"
          }. Unbind it from those targets first.`,
        );
      }
    }

    return this.audienceRepository.update(audienceGroupId, companyId, updatedBy, dto);
  }

  async delete(companyId: number, audienceGroupId: number): Promise<AudienceGroup> {
    await this.findById(companyId, audienceGroupId);

    const usages = await this.audienceRepository.findTargetUsages(audienceGroupId, companyId);
    if (usages.length > 0) {
      throw new ConflictError(
        `Cannot delete: this group is currently used by ${usages.length} entit${
          usages.length === 1 ? "y" : "ies"
        }. Deactivate it instead.`,
      );
    }

    return this.audienceRepository.softDelete(audienceGroupId, companyId);
  }

  // ==========================================
  // Audience Group Rules
  // ==========================================

  async createRule(
    audienceGroupId: number,
    companyId: number,
    dto: CreateAudienceGroupRuleInput,
  ): Promise<AudienceGroupRule> {
    await this.findById(companyId, audienceGroupId);
    try {
      return await this.audienceRepository.createRule(audienceGroupId, companyId, dto);
    } catch (error) {
      this.rethrowRuleUniqueViolation(error);
    }
  }

  async findRules(audienceGroupId: number, companyId: number): Promise<AudienceGroupRule[]> {
    await this.findById(companyId, audienceGroupId);
    return this.audienceRepository.findRules(audienceGroupId, companyId);
  }

  async updateRule(
    audienceGroupId: number,
    ruleId: number,
    companyId: number,
    dto: UpdateAudienceGroupRuleInput,
  ): Promise<AudienceGroupRule> {
    await this.findById(companyId, audienceGroupId);

    const rule = await this.audienceRepository.findRuleById(ruleId, companyId);
    if (!rule || rule.audienceGroupId !== audienceGroupId) {
      throw new NotFoundError("Audience group rule");
    }

    try {
      return await this.audienceRepository.updateRule(ruleId, companyId, dto);
    } catch (error) {
      this.rethrowRuleUniqueViolation(error);
    }
  }

  async deleteRule(
    audienceGroupId: number,
    ruleId: number,
    companyId: number,
  ): Promise<AudienceGroupRule> {
    await this.findById(companyId, audienceGroupId);

    const rule = await this.audienceRepository.findRuleById(ruleId, companyId);
    if (!rule || rule.audienceGroupId !== audienceGroupId) {
      throw new NotFoundError("Audience group rule");
    }

    return this.audienceRepository.deleteRule(ruleId, companyId);
  }

  private rethrowRuleUniqueViolation(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictError(
        "A rule with the same targeting conditions already exists in this audience group.",
      );
    }
    throw error;
  }
}
