import type { ICertificateConfigurationRepository } from "./certificate-configuration.types.js";
import type {
  CreateCertificateTypeInput,
  UpdateCertificateTypeInput,
  CertificateTypeFilterInput,
  CreateCredentialSourceInput,
  UpdateCredentialSourceInput,
  CredentialSourceFilterInput,
  CreateProviderTypeInput,
  UpdateProviderTypeInput,
  ProviderTypeFilterInput,
} from "./certificate-configuration.types.js";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../../common/errors/index.js";

export class CertificateConfigurationService {
  constructor(
    private readonly repository: ICertificateConfigurationRepository
  ) {}

  // ==========================================
  // 1. CertificateType Operations
  // ==========================================

  async createCertificateType(
    companyId: number,
    dto: CreateCertificateTypeInput
  ) {
    const existingName = await this.repository.findCertificateTypeByName(
      companyId,
      dto.name
    );
    if (existingName) {
      throw new ConflictError(`Certificate type with name "${dto.name}" already exists.`);
    }

    const existingSlug = await this.repository.findCertificateTypeBySlug(
      companyId,
      dto.slug
    );
    if (existingSlug) {
      throw new ConflictError(`Certificate type with slug "${dto.slug}" already exists.`);
    }

    return this.repository.createCertificateType(companyId, dto);
  }

  async getCertificateTypeById(companyId: number, id: number) {
    const certType = await this.repository.findCertificateTypeById(companyId, id);
    if (!certType) {
      throw new NotFoundError(`Certificate type with ID ${id} not found.`);
    }
    return certType;
  }

  async getCertificateTypes(
    companyId: number,
    query: CertificateTypeFilterInput
  ) {
    return this.repository.findCertificateTypes(companyId, query);
  }

  async updateCertificateType(
    companyId: number,
    id: number,
    dto: UpdateCertificateTypeInput
  ) {
    await this.getCertificateTypeById(companyId, id);

    if (dto.name) {
      const existingName = await this.repository.findCertificateTypeByName(
        companyId,
        dto.name
      );
      if (existingName && existingName.id !== id) {
        throw new ConflictError(`Certificate type with name "${dto.name}" already exists.`);
      }
    }

    if (dto.slug) {
      const existingSlug = await this.repository.findCertificateTypeBySlug(
        companyId,
        dto.slug
      );
      if (existingSlug && existingSlug.id !== id) {
        throw new ConflictError(`Certificate type with slug "${dto.slug}" already exists.`);
      }
    }

    const result = await this.repository.updateCertificateType(
      companyId,
      id,
      dto
    );
    if (result.count === 0) {
      throw new NotFoundError(`Failed to update certificate type with ID ${id}.`);
    }

    return this.getCertificateTypeById(companyId, id);
  }

  async deleteCertificateType(companyId: number, id: number) {
    const certType = await this.getCertificateTypeById(companyId, id);

    if (certType.isSystem) {
      throw new ForbiddenError(`System certificate types cannot be deleted.`);
    }

    const usageCount = await this.repository.countCertificateTypeUsages(
      companyId,
      id
    );
    if (usageCount > 0) {
      throw new ConflictError(`Cannot delete certificate type because it is associated with ${usageCount} template(s).`);
    }

    return this.repository.softDeleteCertificateType(companyId, id);
  }

  // ==========================================
  // 2. CredentialSource Operations
  // ==========================================

  async createCredentialSource(
    companyId: number,
    dto: CreateCredentialSourceInput
  ) {
    const existingName = await this.repository.findCredentialSourceByName(
      companyId,
      dto.name
    );
    if (existingName) {
      throw new ConflictError(`Credential source with name "${dto.name}" already exists.`);
    }

    const existingSlug = await this.repository.findCredentialSourceBySlug(
      companyId,
      dto.slug
    );
    if (existingSlug) {
      throw new ConflictError(`Credential source with slug "${dto.slug}" already exists.`);
    }

    return this.repository.createCredentialSource(companyId, dto);
  }

  async getCredentialSourceById(companyId: number, id: number) {
    const source = await this.repository.findCredentialSourceById(companyId, id);
    if (!source) {
      throw new NotFoundError(`Credential source with ID ${id} not found.`);
    }
    return source;
  }

  async getCredentialSources(
    companyId: number,
    query: CredentialSourceFilterInput
  ) {
    return this.repository.findCredentialSources(companyId, query);
  }

  async updateCredentialSource(
    companyId: number,
    id: number,
    dto: UpdateCredentialSourceInput
  ) {
    await this.getCredentialSourceById(companyId, id);

    if (dto.name) {
      const existingName = await this.repository.findCredentialSourceByName(
        companyId,
        dto.name
      );
      if (existingName && existingName.id !== id) {
        throw new ConflictError(`Credential source with name "${dto.name}" already exists.`);
      }
    }

    if (dto.slug) {
      const existingSlug = await this.repository.findCredentialSourceBySlug(
        companyId,
        dto.slug
      );
      if (existingSlug && existingSlug.id !== id) {
        throw new ConflictError(`Credential source with slug "${dto.slug}" already exists.`);
      }
    }

    const result = await this.repository.updateCredentialSource(
      companyId,
      id,
      dto
    );
    if (result.count === 0) {
      throw new NotFoundError(`Failed to update credential source with ID ${id}.`);
    }

    return this.getCredentialSourceById(companyId, id);
  }

  async deleteCredentialSource(companyId: number, id: number) {
    const source = await this.getCredentialSourceById(companyId, id);

    if (source.isSystem) {
      throw new ForbiddenError(`System credential sources cannot be deleted.`);
    }

    const usageCount = await this.repository.countCredentialSourceUsages(
      companyId,
      id
    );
    if (usageCount > 0) {
      throw new ConflictError(`Cannot delete credential source because it is referenced in ${usageCount} external certificate(s).`);
    }

    return this.repository.softDeleteCredentialSource(companyId, id);
  }

  // ==========================================
  // 3. ProviderType Operations
  // ==========================================

  async createProviderType(companyId: number, dto: CreateProviderTypeInput) {
    const existingName = await this.repository.findProviderTypeByName(
      companyId,
      dto.name
    );
    if (existingName) {
      throw new ConflictError(`Provider type with name "${dto.name}" already exists.`);
    }

    const existingSlug = await this.repository.findProviderTypeBySlug(
      companyId,
      dto.slug
    );
    if (existingSlug) {
      throw new ConflictError(`Provider type with slug "${dto.slug}" already exists.`);
    }

    return this.repository.createProviderType(companyId, dto);
  }

  async getProviderTypeById(companyId: number, id: number) {
    const provider = await this.repository.findProviderTypeById(companyId, id);
    if (!provider) {
      throw new NotFoundError(`Provider type with ID ${id} not found.`);
    }
    return provider;
  }

  async getProviderTypes(companyId: number, query: ProviderTypeFilterInput) {
    return this.repository.findProviderTypes(companyId, query);
  }

  async updateProviderType(
    companyId: number,
    id: number,
    dto: UpdateProviderTypeInput
  ) {
    await this.getProviderTypeById(companyId, id);

    if (dto.name) {
      const existingName = await this.repository.findProviderTypeByName(
        companyId,
        dto.name
      );
      if (existingName && existingName.id !== id) {
        throw new ConflictError(`Provider type with name "${dto.name}" already exists.`);
      }
    }

    if (dto.slug) {
      const existingSlug = await this.repository.findProviderTypeBySlug(
        companyId,
        dto.slug
      );
      if (existingSlug && existingSlug.id !== id) {
        throw new ConflictError(`Provider type with slug "${dto.slug}" already exists.`);
      }
    }

    const result = await this.repository.updateProviderType(
      companyId,
      id,
      dto
    );
    if (result.count === 0) {
      throw new NotFoundError(`Failed to update provider type with ID ${id}.`);
    }

    return this.getProviderTypeById(companyId, id);
  }

  async deleteProviderType(companyId: number, id: number) {
    const provider = await this.getProviderTypeById(companyId, id);

    if (provider.isSystem) {
      throw new ForbiddenError(`System provider types cannot be deleted.`);
    }

    const usageCount = await this.repository.countProviderTypeUsages(
      companyId,
      id
    );
    if (usageCount > 0) {
      throw new ConflictError(`Cannot delete provider type because it is referenced in ${usageCount} external provider(s).`);
    }

    return this.repository.softDeleteProviderType(companyId, id);
  }

  // TEMPLATE OPERATIONS REMOVED — moved to template-management module

}
