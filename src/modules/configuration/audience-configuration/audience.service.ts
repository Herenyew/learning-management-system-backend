import { AudienceGroup, AudienceGroupRule } from "@prisma/client";
import { IAudienceRepository, AudienceGroupFilter } from "./audience.repository.js";
import {
  CreateAudienceGroupDto,
  UpdateAudienceGroupDto,
  CreateAudienceGroupRuleDto,
  UpdateAudienceGroupRuleDto,
} from "./audience.dto.js";
import { NotFoundError, ConflictError } from "../../../common/errors/http-errors.js";
import { buildPaginationMeta } from "../../../common/http/pagination.js";

export class AudienceService {
  constructor(private readonly audienceRepository: IAudienceRepository) {}

  // ==========================================
  // Audience Groups
  // ==========================================

  async create(
    companyId: number,
    createdBy: number,
    dto: CreateAudienceGroupDto,
  ): Promise<AudienceGroup> {
    const existing = await this.audienceRepository.findByName(companyId, dto.name);
    if (existing) {
      throw new ConflictError("Audience group already exists.");
    }

    return this.audienceRepository.create({
      company: { connect: { id: companyId } },
      createdByUser: { connect: { id: createdBy } },
      name: dto.name,
      description: dto.description,
      isActive: true,
    });
  }

  async findById(companyId: number, audienceGroupId: number): Promise<AudienceGroup> {
    const group = await this.audienceRepository.findById(audienceGroupId, companyId);
    if (!group) {
      throw new NotFoundError("Audience group");
    }
    return group;
  }

  async findMany(filter: AudienceGroupFilter, page: number, pageSize: number) {
    const [data, totalRecords] = await Promise.all([
      this.audienceRepository.findMany(filter, page, pageSize),
      this.audienceRepository.countMany(filter),
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
    dto: UpdateAudienceGroupDto,
  ): Promise<AudienceGroup> {
    const group = await this.findById(companyId, audienceGroupId);

    // If changing name, ensure uniqueness
    if (dto.name && dto.name !== group.name) {
      const existing = await this.audienceRepository.findByName(companyId, dto.name);
      if (existing) {
        throw new ConflictError("Audience group already exists.");
      }
    }

    // Safety Check: Guard deactivation if group is actively bound to targets
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

    return this.audienceRepository.update(audienceGroupId, companyId, {
      ...dto,
      updatedByUser: { connect: { id: updatedBy } },
    });
  }

  async delete(companyId: number, audienceGroupId: number): Promise<AudienceGroup> {
    await this.findById(companyId, audienceGroupId);

    const usages = await this.audienceRepository.findTargetUsages(
      audienceGroupId,
      companyId,
    );

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
    dto: CreateAudienceGroupRuleDto,
  ): Promise<AudienceGroupRule> {
    // Ensures group exists and belongs to this company
    await this.findById(companyId, audienceGroupId);

    return this.audienceRepository.createRule(audienceGroupId, companyId, dto);
  }

  async findRules(
    audienceGroupId: number,
    companyId: number,
  ): Promise<AudienceGroupRule[]> {
    await this.findById(companyId, audienceGroupId);
    return this.audienceRepository.findRules(audienceGroupId, companyId);
  }

  async updateRule(
    audienceGroupId: number,
    ruleId: number,
    companyId: number,
    dto: UpdateAudienceGroupRuleDto,
  ): Promise<AudienceGroupRule> {
    await this.findById(companyId, audienceGroupId);

    const rule = await this.audienceRepository.findRuleById(ruleId, companyId);

    // Path ownership validation
    if (!rule || rule.audienceGroupId !== audienceGroupId) {
      throw new NotFoundError("Audience group rule");
    }

    return this.audienceRepository.updateRule(ruleId, companyId, dto);
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
}