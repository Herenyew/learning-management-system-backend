import { z } from "zod";
import { createXpRuleSchema, updateXpRuleSchema, xpRuleFilterSchema } from "./xp-rules.dto.js";
import { Prisma } from "@prisma/client";

export type CreateXpRuleInput = z.infer<typeof createXpRuleSchema>;
export type UpdateXpRuleInput = z.infer<typeof updateXpRuleSchema>;
export type XpRuleFilterInput = z.infer<typeof xpRuleFilterSchema>;

export interface XpRuleFilterParams {
  search?: string;
  categoryId?: number;
  triggerEventId?: number;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export type XpRule = Prisma.XpRuleGetPayload<{}>;

export interface XpRuleLookupOption {
  id: number;
  name: string;
  slug?: string | null;
}

export interface XpRuleLookups {
  categories: XpRuleLookupOption[];
  triggerEvents: XpRuleLookupOption[];
}

export type PaginatedXpRuleResult = {
  data: XpRule[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};

export interface IXpRulesRepository {
  createXpRule(companyId: number, userId: number, data: CreateXpRuleInput): Promise<XpRule>;
  findXpRuleById(companyId: number, id: number): Promise<XpRule | null>;
  findXpRuleByName(companyId: number, name: string): Promise<XpRule | null>;
  findXpRules(companyId: number, query: XpRuleFilterParams): Promise<PaginatedXpRuleResult>;
  countXpRules(companyId: number, query: XpRuleFilterParams): Promise<number>;
  updateXpRule(companyId: number, id: number, userId: number, data: UpdateXpRuleInput): Promise<XpRule>;
  softDeleteXpRule(companyId: number, id: number, userId: number): Promise<XpRule>;
  findXpRuleUsages(companyId: number, id: number): Promise<any[]>;
  findRuleLookups(companyId: number): Promise<XpRuleLookups>;
}
