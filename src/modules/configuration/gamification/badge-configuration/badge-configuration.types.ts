import { z } from "zod";
import {
  createBadgeSchema,
  updateBadgeSchema,
  badgeFilterSchema,
  createBadgeRuleSchema,
  updateBadgeRuleSchema,
  badgeRuleFilterSchema,
} from "./badge-configuration.dto.js";
import type { Badge as PrismaBadge, BadgeRule as PrismaBadgeRule, BadgeCategory as PrismaBadgeCategory, Prisma } from "@prisma/client";

export type CreateBadgeInput = z.infer<typeof createBadgeSchema>;
export type UpdateBadgeInput = z.infer<typeof updateBadgeSchema>;
export type BadgeFilterInput = z.infer<typeof badgeFilterSchema>;

export type CreateBadgeRuleInput = z.infer<typeof createBadgeRuleSchema>;
export type UpdateBadgeRuleInput = z.infer<typeof updateBadgeRuleSchema>;
export type BadgeRuleFilterInput = z.infer<typeof badgeRuleFilterSchema>;

export interface BadgeFilterParams {
  search?: string;
  badgeCategoryId?: number;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface BadgeRuleFilterParams {
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export type Badge = Prisma.BadgeGetPayload<{}>;
export type BadgeRule = Prisma.BadgeRuleGetPayload<{}>;

export type PaginatedBadgeResult = {
  data: PrismaBadge[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};

export type PaginatedBadgeRuleResult = {
  data: PrismaBadgeRule[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};

export interface IBadgeRepository {
  createBadge(companyId: number, userId: number, data: CreateBadgeInput): Promise<Badge>;
  findBadgeById(companyId: number, id: number): Promise<Badge | null>;
  findBadges(companyId: number, query: BadgeFilterParams): Promise<PaginatedBadgeResult>;
  countBadges(companyId: number, query: BadgeFilterParams): Promise<number>;
  listBadgeCategories(companyId: number): Promise<PrismaBadgeCategory[]>;
  updateBadge(companyId: number, id: number, userId: number, data: UpdateBadgeInput): Promise<Badge>;
  softDeleteBadge(companyId: number, id: number, userId: number): Promise<Badge>;

  createBadgeRule(companyId: number, badgeId: number, userId: number, data: CreateBadgeRuleInput): Promise<BadgeRule>;
  findBadgeRuleById(companyId: number, badgeId: number, ruleId: number): Promise<BadgeRule | null>;
  findBadgeRules(companyId: number, badgeId: number, query: BadgeRuleFilterParams): Promise<PaginatedBadgeRuleResult>;
  updateBadgeRule(companyId: number, badgeId: number, ruleId: number, userId: number, data: UpdateBadgeRuleInput): Promise<BadgeRule>;
  deleteBadgeRule(companyId: number, badgeId: number, ruleId: number, userId: number): Promise<BadgeRule>;
}
