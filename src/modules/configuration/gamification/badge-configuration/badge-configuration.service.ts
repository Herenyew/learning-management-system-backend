import type { BadgeRepository } from "./badge-configuration.repository.js";
import type { CreateBadgeInput, UpdateBadgeInput, CreateBadgeRuleInput, UpdateBadgeRuleInput } from "./badge-configuration.types.js";
import { ConflictError, NotFoundError, ValidationError } from "../../../../common/errors/http-errors.js";

export class BadgeService {
  constructor(private repo: BadgeRepository, private prisma: any) {}

  async createBadge(companyId: number, userId: number, data: CreateBadgeInput) {
    const existing = await this.repo.findBadges(companyId, { search: data.name, page: 1, limit: 1 } as any);
    if (existing.data.some((b) => b.name.toLowerCase() === data.name.toLowerCase())) throw new ConflictError("Badge with this name already exists.");
    return this.repo.createBadge(companyId, userId, data);
  }

  async listBadges(companyId: number, query: any) {
    return this.repo.findBadges(companyId, query);
  }

  async getBadgeById(companyId: number, id: number) {
    const item = await this.repo.findBadgeById(companyId, id);
    if (!item) throw new NotFoundError(`Badge with ID ${id} not found.`);
    return item;
  }

  async updateBadge(companyId: number, id: number, userId: number, data: UpdateBadgeInput) {
    await this.getBadgeById(companyId, id);
    return this.repo.updateBadge(companyId, id, userId, data);
  }

  async deleteBadge(companyId: number, id: number, userId: number) {
    const usages = await this.repo.findBadgeRules(companyId, id, { page: 1, limit: 1 } as any);
    if (usages.data.length > 0) throw new ValidationError("Cannot delete badge while it has rules.");
    return this.repo.softDeleteBadge(companyId, id, userId);
  }

  // Badge rules
  async createBadgeRule(companyId: number, badgeId: number, userId: number, data: CreateBadgeRuleInput) {
    await this.getBadgeById(companyId, badgeId);
    return this.repo.createBadgeRule(companyId, badgeId, userId, data);
  }

  async listBadgeRules(companyId: number, badgeId: number, query: any) {
    await this.getBadgeById(companyId, badgeId);
    return this.repo.findBadgeRules(companyId, badgeId, query);
  }

  async updateBadgeRule(companyId: number, badgeId: number, ruleId: number, userId: number, data: UpdateBadgeRuleInput) {
    const rule = await this.repo.findBadgeRuleById(companyId, badgeId, ruleId);
    if (!rule) throw new NotFoundError("Badge rule not found.");
    return this.repo.updateBadgeRule(companyId, badgeId, ruleId, userId, data);
  }

  async deleteBadgeRule(companyId: number, badgeId: number, ruleId: number, userId: number) {
    const rule = await this.repo.findBadgeRuleById(companyId, badgeId, ruleId);
    if (!rule) throw new NotFoundError("Badge rule not found.");
    return this.repo.deleteBadgeRule(companyId, badgeId, ruleId, userId);
  }
}
