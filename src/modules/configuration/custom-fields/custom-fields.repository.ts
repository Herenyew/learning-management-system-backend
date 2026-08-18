import { Prisma } from "@prisma/client";
import type { CustomFieldTarget, PrismaClient } from "@prisma/client";
import type {
  CreateCustomFieldInput,
  UpdateCustomFieldInput,
  CustomFieldFilterParams,
} from "./custom-fields.types.js";

import type { ICustomFieldsRepository } from "./custom-fields.types.js";

export class CustomFieldsRepository implements ICustomFieldsRepository {
  constructor(private prisma: PrismaClient) {}

  async createCustomFieldDefinition(companyId: number, userId: number, data: CreateCustomFieldInput) {
    return this.prisma.customFieldDefinition.create({
      data: {
        companyId,
        createdBy: userId,
        label: data.name,
        fieldKey: data.fieldKey,
        target: data.target,
        description: data.description,
        fieldType: data.fieldType,
        settingsJson: data.settingsJson ?? Prisma.JsonNull,
        isActive: data.isActive,
      },
    });
  }

  async findCustomFieldDefinitionById(companyId: number, id: number) {
    return this.prisma.customFieldDefinition.findFirst({ where: { id, companyId, deletedAt: null } });
  }

  async findCustomFieldDefinitionByKey(companyId: number, key: string, target: CustomFieldTarget) {
    return this.prisma.customFieldDefinition.findFirst({ where: { companyId, fieldKey: key, target, deletedAt: null } });
  }

  async findCustomFieldDefinitions(companyId: number, query: CustomFieldFilterParams) {
    const { search, target, isActive, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const where: any = { companyId, deletedAt: null };
    if (target) where.target = target;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) where.OR = [{ name: { contains: search, mode: "insensitive" } }, { fieldKey: { contains: search, mode: "insensitive" } }];

    const [data, total] = await Promise.all([
      this.prisma.customFieldDefinition.findMany({ where, skip, take: limit, orderBy: { label: "asc" } }),
      this.prisma.customFieldDefinition.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async countCustomFieldDefinitions(companyId: number, query: CustomFieldFilterParams) {
    const { search, target, isActive } = query;
    const where: any = { companyId, deletedAt: null };
    if (target) where.target = target;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) where.OR = [{ name: { contains: search, mode: "insensitive" } }, { fieldKey: { contains: search, mode: "insensitive" } }];
    return this.prisma.customFieldDefinition.count({ where });
  }

  async updateCustomFieldDefinition(companyId: number, id: number, userId: number, data: UpdateCustomFieldInput) {
    return this.prisma.customFieldDefinition.update({ where: { id }, data: { ...data, updatedBy: userId } as any });
  }

  async softDeleteCustomFieldDefinition(companyId: number, id: number, userId: number) {
    return this.prisma.customFieldDefinition.update({ where: { id }, data: { deletedAt: new Date(), updatedBy: userId } });
  }

  async findCustomFieldDefinitionUsages(companyId: number, id: number) {
    // This is domain-specific. Provide a fallback empty list to be implemented later.
    return [] as any[];
  }
}
