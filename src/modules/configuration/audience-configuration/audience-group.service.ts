// audience-group.service.ts
import { AudienceGroup, AudienceGroupRule } from "@prisma/client";
import { IAudienceGroupRepository, AudienceGroupFilter } from "./audience-group.repository.js";
import { CreateAudienceGroupDto, UpdateAudienceGroupDto, CreateAudienceGroupRuleDto, UpdateAudienceGroupRuleDto } from "./dto-index.js";
import { NotFoundError, ConflictError } from "../../../common/errors/http-errors.js";
import { buildPaginationMeta } from "../../../common/http/pagination.js";

export class AudienceGroupService {
  constructor(private readonly audienceGroupRepository: IAudienceGroupRepository) {}

  async create(companyId: number, createdBy: number, dto: CreateAudienceGroupDto): Promise<AudienceGroup> {
    const existing = await this.audienceGroupRepository.findByName(companyId, dto.name);
    if (existing) throw new ConflictError("Audience group already exists.");

    return this.audienceGroupRepository.create({
      company: { connect: { id: companyId } },
      createdByUser: { connect: { id: createdBy } },
      name: dto.name,
      description: dto.description,
      isActive: true,
    });
  }

  async findById(companyId: number, id: number): Promise<AudienceGroup> {
    const group = await this.audienceGroupRepository.findById(id, companyId);
    if (!group) throw new NotFoundError("Audience group");
    return group;
  }

  async findMany(filter: AudienceGroupFilter, page: number, pageSize: number) {
    const [data, totalRecords] = await Promise.all([
      this.audienceGroupRepository.findMany(filter, page, pageSize),
      this.audienceGroupRepository.countMany(filter),
    ]);
    return { data, pagination: buildPaginationMeta(page, pageSize, totalRecords) };
  }

  async update(companyId: number, id: number, updatedBy: number, dto: UpdateAudienceGroupDto): Promise<AudienceGroup> {
    const group = await this.findById(companyId, id);

    if (dto.name && dto.name !== group.name) {
      const existing = await this.audienceGroupRepository.findByName(companyId, dto.name);
      if (existing) throw new ConflictError("Audience group already exists.");
    }

    return this.audienceGroupRepository.update(id, companyId, {
      ...dto,
      updatedByUser: { connect: { id: updatedBy } },
    });
  }

  async delete(companyId: number, id: number): Promise<AudienceGroup> {
    await this.findById(companyId, id);

    const usages = await this.audienceGroupRepository.findTargetUsages(id, companyId);
    if (usages.length > 0) {
      throw new ConflictError(
        `Cannot delete: this group is currently used by ${usages.length} entit${usages.length === 1 ? "y" : "ies"}. Deactivate it instead.`
      );
    }

    return this.audienceGroupRepository.softDelete(id, companyId);
  }

  // ==========================
  // Rules
  // ==========================

  async createRule(audienceGroupId: number, companyId: number, dto: CreateAudienceGroupRuleDto): Promise<AudienceGroupRule> {
    await this.findById(companyId, audienceGroupId); // confirms the group exists AND belongs to this company
    this.validateRule(dto);
    return this.audienceGroupRepository.createRule(audienceGroupId, companyId, dto);
  }

  async updateRule(ruleId: number, companyId: number, dto: UpdateAudienceGroupRuleDto): Promise<AudienceGroupRule> {
    this.validateRule(dto);
    return this.audienceGroupRepository.updateRule(ruleId, companyId, dto);
  }

  async deleteRule(ruleId: number, companyId: number): Promise<AudienceGroupRule> {
    return this.audienceGroupRepository.deleteRule(ruleId, companyId);
  }

  async findRules(audienceGroupId: number, companyId: number) {
    return this.audienceGroupRepository.findRules(audienceGroupId, companyId);
  }

  // ==========================
  // Private
  // ==========================

  private validateRule(dto: CreateAudienceGroupRuleDto | UpdateAudienceGroupRuleDto) {
    const fields = [dto.departmentId, dto.jobTitleId, dto.jobLevelId, dto.appRoleId, dto.employmentType, dto.hireWithinDays];
    const hasCondition = fields.some((f) => f !== undefined && f !== null);

    if (!hasCondition) {
      throw new ConflictError("At least one matching condition is required.");
    }
  }
}