import type { CreateXpRuleInput, UpdateXpRuleInput, XpRuleFilterInput } from "./xp-rules.types.js";
import type { IXpRulesRepository } from "./xp-rules.types.js";
import { ConflictError, NotFoundError, ValidationError } from "../../../../common/errors/http-errors.js";

export class XpRulesService {
  constructor(private repo: IXpRulesRepository, private prisma: any) {}

  async createXpRule(companyId: number, userId: number, data: CreateXpRuleInput) {
    const existing = await this.repo.findXpRuleByName(companyId, data.name);
    if (existing) throw new ConflictError(`XP rule with name '${data.name}' already exists.`);
    return this.repo.createXpRule(companyId, userId, data);
  }

  async listXpRules(companyId: number, query: XpRuleFilterInput) {
    return this.repo.findXpRules(companyId, query);
  }

  async getXpRuleById(companyId: number, id: number) {
    const item = await this.repo.findXpRuleById(companyId, id);
    if (!item) throw new NotFoundError(`XP rule with ID ${id} not found.`);
    return item;
  }

  async updateXpRule(companyId: number, id: number, userId: number, data: UpdateXpRuleInput) {
    await this.getXpRuleById(companyId, id);
    return this.repo.updateXpRule(companyId, id, userId, data);
  }

  async deleteXpRule(companyId: number, id: number, userId: number) {
    const usages = await this.repo.findXpRuleUsages(companyId, id);
    if (usages.length > 0) throw new ValidationError("Cannot delete XP rule while it is referenced by transactions.");
    return this.repo.softDeleteXpRule(companyId, id, userId);
  }
}
