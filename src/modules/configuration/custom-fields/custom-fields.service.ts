import type { PrismaClient } from "@prisma/client";
import type { ICustomFieldsRepository, CreateCustomFieldInput, UpdateCustomFieldInput } from "./custom-fields.types.js";
import { ConflictError, NotFoundError, ValidationError } from "../../../common/errors/http-errors.js";

export class CustomFieldsService {
  constructor(private repo: ICustomFieldsRepository, private prisma: PrismaClient) {}

  async createCustomField(companyId: number, userId: number, data: CreateCustomFieldInput) {
    // Unique fieldKey per company+target
    const existing = await this.repo.findCustomFieldDefinitionByKey(companyId, data.fieldKey, data.target);
    if (existing) throw new ConflictError("Field key already exists for the target in this company.");

    return this.repo.createCustomFieldDefinition(companyId, userId, data);
  }

  async getCustomFields(companyId: number, query: any) {
    return this.repo.findCustomFieldDefinitions(companyId, query);
  }

  async getCustomFieldById(companyId: number, id: number) {
    const item = await this.repo.findCustomFieldDefinitionById(companyId, id);
    if (!item) throw new NotFoundError(`Custom field definition with ID ${id} not found.`);
    return item;
  }

  async updateCustomField(companyId: number, id: number, userId: number, data: UpdateCustomFieldInput) {
    const existing = await this.getCustomFieldById(companyId, id);
    if (data.fieldKey && data.fieldKey !== existing.fieldKey) {
      const other = await this.repo.findCustomFieldDefinitionByKey(companyId, data.fieldKey, existing.target);
      if (other && other.id !== id) throw new ConflictError("Field key already in use for this target.");
    }
    return this.repo.updateCustomFieldDefinition(companyId, id, userId, data);
  }

  async deleteCustomField(companyId: number, id: number, userId: number) {
    const existing = await this.getCustomFieldById(companyId, id);
    const usages = await this.repo.findCustomFieldDefinitionUsages(companyId, id);
    if (usages.length > 0) throw new ValidationError("Cannot delete custom field definition while it is in use.");
    return this.repo.softDeleteCustomFieldDefinition(companyId, id, userId);
  }
}
