import { $Enums } from "@prisma/client";
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from "../../../common/errors/http-errors.js"; // Adjust import path
import { EnrollmentConfigurationRepository } from "./enrollment-configuration.repository.js";
import type {
  CreateEnrollmentRuleTypeInput,
  UpdateEnrollmentRuleTypeInput,
  EnrollmentRuleTypeFilterQueryInput,
  CreateEnrollmentRuleInput,
  UpdateEnrollmentRuleInput,
  EnrollmentRuleFilterQueryInput,
  EnrollmentReferenceOptionsQueryInput,
} from "./enrollment-configuration.types.js";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export class EnrollmentConfigurationService {
  constructor(private repo: EnrollmentConfigurationRepository) {}

  // ==========================================
  // 1. EnrollmentRuleType Methods
  // ==========================================

  async createEnrollmentRuleType(
    companyId: number,
    data: CreateEnrollmentRuleTypeInput
  ) {
    const existingName = await this.repo.findEnrollmentRuleTypeByName(companyId, data.name);
    if (existingName) {
      throw new ConflictError(`Enrollment rule type with name '${data.name}' already exists.`);
    }

    const generatedSlug = data.slug ? slugify(data.slug) : slugify(data.name);

    const existingSlug = await this.repo.findEnrollmentRuleTypeBySlug(companyId, generatedSlug);
    if (existingSlug) {
      throw new ConflictError(`Enrollment rule type with slug '${generatedSlug}' already exists.`);
    }

    return this.repo.createEnrollmentRuleType(companyId, {
      ...data,
      slug: generatedSlug,
    });
  }

  async getEnrollmentRuleTypeById(companyId: number, id: number) {
    const type = await this.repo.findEnrollmentRuleTypeById(companyId, id);
    if (!type) {
      throw new NotFoundError(`Enrollment rule type with ID ${id} not found.`);
    }
    return type;
  }

  async listEnrollmentRuleTypes(
    companyId: number,
    query: EnrollmentRuleTypeFilterQueryInput
  ) {
    return this.repo.findEnrollmentRuleTypes(companyId, query);
  }

  async updateEnrollmentRuleType(
    companyId: number,
    id: number,
    data: UpdateEnrollmentRuleTypeInput
  ) {
    const existingType = await this.getEnrollmentRuleTypeById(companyId, id);

    if (existingType.isSystem) {
      throw new ValidationError("System-defined enrollment rule types cannot be modified.");
    }

    if (data.name) {
      const existingName = await this.repo.findEnrollmentRuleTypeByName(companyId, data.name);
      if (existingName && existingName.id !== id) {
        throw new ConflictError(`Enrollment rule type with name '${data.name}' already exists.`);
      }
    }

    if (data.slug) {
      const newSlug = slugify(data.slug);
      const existingSlug = await this.repo.findEnrollmentRuleTypeBySlug(companyId, newSlug);
      if (existingSlug && existingSlug.id !== id) {
        throw new ConflictError(`Enrollment rule type with slug '${newSlug}' already exists.`);
      }
    }

    return this.repo.updateEnrollmentRuleType(companyId, id, data).then(async () =>
      this.getEnrollmentRuleTypeById(companyId, id)
    );
  }

  async deleteEnrollmentRuleType(companyId: number, id: number) {
    const existingType = await this.getEnrollmentRuleTypeById(companyId, id);

    if (existingType.isSystem) {
      throw new ValidationError("System-defined enrollment rule types cannot be deleted.");
    }

    const usageCount = await this.repo.countEnrollmentRuleTypeUsages(companyId, id);
    if (usageCount > 0) {
      throw new ValidationError(
        `Cannot delete enrollment rule type. It is referenced by ${usageCount} active rule(s).`
      );
    }

    return this.repo.softDeleteEnrollmentRuleType(companyId, id);
  }

  // ==========================================
  // 2. EnrollmentRule Methods
  // ==========================================

  async createEnrollmentRule(
    companyId: number,
    userId: number,
    data: CreateEnrollmentRuleInput
  ) {
    const existingName = await this.repo.findEnrollmentRuleByName(companyId, data.name);
    if (existingName) {
      throw new ConflictError(`Enrollment rule with name '${data.name}' already exists.`);
    }

    const ruleType = await this.repo.findEnrollmentRuleTypeById(companyId, data.ruleTypeId);
    if (!ruleType) {
      throw new NotFoundError(`Enrollment rule type with ID ${data.ruleTypeId} not found.`);
    }

    if (data.entityType === $Enums.EnrollmentEntityType.COURSE && data.courseVersionId) {
      const courseVersion = await this.repo.findCourseVersionById(companyId, data.courseVersionId);
      if (!courseVersion) {
        throw new NotFoundError(`Course version with ID ${data.courseVersionId} not found.`);
      }
    }

    if (data.entityType === $Enums.EnrollmentEntityType.PROGRAM && data.programId) {
      const program = await this.repo.findLearningProgramById(companyId, data.programId);
      if (!program) {
        throw new NotFoundError(`Learning program with ID ${data.programId} not found.`);
      }
    }

    if (data.targetAudienceId) {
      const audience = await this.repo.findTargetAudienceById(companyId, data.targetAudienceId);
      if (!audience) {
        throw new NotFoundError(`Target audience with ID ${data.targetAudienceId} not found.`);
      }
    }

    return this.repo.createEnrollmentRule(companyId, userId, data);
  }

  async getEnrollmentRuleById(companyId: number, id: number) {
    const rule = await this.repo.findEnrollmentRuleById(companyId, id);
    if (!rule) {
      throw new NotFoundError(`Enrollment rule with ID ${id} not found.`);
    }
    return rule;
  }

  async listEnrollmentRules(
    companyId: number,
    query: EnrollmentRuleFilterQueryInput
  ) {
    return this.repo.findEnrollmentRules(companyId, query);
  }

  async updateEnrollmentRule(
    companyId: number,
    id: number,
    userId: number,
    data: UpdateEnrollmentRuleInput
  ) {
    await this.getEnrollmentRuleById(companyId, id);

    if (data.name) {
      const existingName = await this.repo.findEnrollmentRuleByName(companyId, data.name);
      if (existingName && existingName.id !== id) {
        throw new ConflictError(`Enrollment rule with name '${data.name}' already exists.`);
      }
    }

    if (data.ruleTypeId) {
      const ruleType = await this.repo.findEnrollmentRuleTypeById(companyId, data.ruleTypeId);
      if (!ruleType) {
        throw new NotFoundError(`Enrollment rule type with ID ${data.ruleTypeId} not found.`);
      }
    }

    if (data.entityType === $Enums.EnrollmentEntityType.COURSE && data.courseVersionId) {
      const courseVersion = await this.repo.findCourseVersionById(companyId, data.courseVersionId);
      if (!courseVersion) {
        throw new NotFoundError(`Course version with ID ${data.courseVersionId} not found.`);
      }
    }

    if (data.entityType === $Enums.EnrollmentEntityType.PROGRAM && data.programId) {
      const program = await this.repo.findLearningProgramById(companyId, data.programId);
      if (!program) {
        throw new NotFoundError(`Learning program with ID ${data.programId} not found.`);
      }
    }

    if (data.targetAudienceId) {
      const audience = await this.repo.findTargetAudienceById(companyId, data.targetAudienceId);
      if (!audience) {
        throw new NotFoundError(`Target audience with ID ${data.targetAudienceId} not found.`);
      }
    }

    return this.repo.updateEnrollmentRule(companyId, id, userId, data).then(async () =>
      this.getEnrollmentRuleById(companyId, id)
    );
  }

  async deleteEnrollmentRule(companyId: number, id: number) {
    await this.getEnrollmentRuleById(companyId, id);

    const usageCount = await this.repo.countEnrollmentRuleUsages(companyId, id);
    if (usageCount > 0) {
      throw new ValidationError(
        `Cannot delete enrollment rule. It is referenced by ${usageCount} enrollment record(s).`
      );
    }

    return this.repo.softDeleteEnrollmentRule(companyId, id);
  }

  async listCourseVersionOptions(companyId: number, query: EnrollmentReferenceOptionsQueryInput) {
    return this.repo.findCourseVersionOptions(companyId, query);
  }

  async listLearningProgramOptions(companyId: number, query: EnrollmentReferenceOptionsQueryInput) {
    return this.repo.findLearningProgramOptions(companyId, query);
  }
}
