// repositories/audience-group.repository.ts
import { AudienceGroup, AudienceGroupRule, Prisma } from "@prisma/client";

export interface AudienceGroupFilter {
  companyId: number;
  search?: string;
  isActive?: boolean;
}
// this interface defines the methods that the AudienceGroupRepository should implement. 
// It is used to abstract the data access layer 
// and provide a consistent API for interacting with audience groups and their rules in the database.
export interface IAudienceGroupRepository {
  // Audience Group
  create(data: Prisma.AudienceGroupCreateInput): Promise<AudienceGroup>;
  findById(id: number, companyId: number): Promise<AudienceGroup | null>;
  findByName(companyId: number, name: string): Promise<AudienceGroup | null>;
  findMany(filter: AudienceGroupFilter, page: number, pageSize: number): Promise<AudienceGroup[]>;
  countMany(filter: AudienceGroupFilter): Promise<number>;
  update(id: number, companyId: number, data: Prisma.AudienceGroupUpdateInput): Promise<AudienceGroup>;
  softDelete(id: number, companyId: number): Promise<AudienceGroup>;
  findTargetUsages(id: number, companyId: number): Promise<{ entityType: string; entityId: number }[]>;

  // Rules
  createRule(
    audienceGroupId: number,
    companyId: number,
    data: Omit<Prisma.AudienceGroupRuleCreateInput, "audienceGroup" | "company">
  ): Promise<AudienceGroupRule>;
  updateRule(id: number, companyId: number, data: Prisma.AudienceGroupRuleUpdateInput): Promise<AudienceGroupRule>;
  deleteRule(id: number, companyId: number): Promise<AudienceGroupRule>;
  findRules(audienceGroupId: number, companyId: number): Promise<AudienceGroupRule[]>;
}