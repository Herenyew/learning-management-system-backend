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
  CreateCertificateTemplateInput,
  UpdateCertificateTemplateInput,
  CertificateTemplateFilterInput,
  CreateCertificateTemplateSignerInput,
  UpdateCertificateTemplateSignerInput,
} from "./certificate-configuration.types.js";

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
      throw new Error(`Certificate type with name "${dto.name}" already exists.`);
    }

    const existingSlug = await this.repository.findCertificateTypeBySlug(
      companyId,
      dto.slug
    );
    if (existingSlug) {
      throw new Error(`Certificate type with slug "${dto.slug}" already exists.`);
    }

    return this.repository.createCertificateType(companyId, dto);
  }

  async getCertificateTypeById(companyId: number, id: number) {
    const certType = await this.repository.findCertificateTypeById(companyId, id);
    if (!certType) {
      throw new Error(`Certificate type with ID ${id} not found.`);
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
        throw new Error(`Certificate type with name "${dto.name}" already exists.`);
      }
    }

    if (dto.slug) {
      const existingSlug = await this.repository.findCertificateTypeBySlug(
        companyId,
        dto.slug
      );
      if (existingSlug && existingSlug.id !== id) {
        throw new Error(`Certificate type with slug "${dto.slug}" already exists.`);
      }
    }

    const result = await this.repository.updateCertificateType(
      companyId,
      id,
      dto
    );
    if (result.count === 0) {
      throw new Error(`Failed to update certificate type with ID ${id}.`);
    }

    return this.getCertificateTypeById(companyId, id);
  }

  async deleteCertificateType(companyId: number, id: number) {
    const certType = await this.getCertificateTypeById(companyId, id);

    if (certType.isSystem) {
      throw new Error(`System certificate types cannot be deleted.`);
    }

    const usageCount = await this.repository.countCertificateTypeUsages(
      companyId,
      id
    );
    if (usageCount > 0) {
      throw new Error(
        `Cannot delete certificate type because it is associated with ${usageCount} template(s).`
      );
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
      throw new Error(`Credential source with name "${dto.name}" already exists.`);
    }

    const existingSlug = await this.repository.findCredentialSourceBySlug(
      companyId,
      dto.slug
    );
    if (existingSlug) {
      throw new Error(`Credential source with slug "${dto.slug}" already exists.`);
    }

    return this.repository.createCredentialSource(companyId, dto);
  }

  async getCredentialSourceById(companyId: number, id: number) {
    const source = await this.repository.findCredentialSourceById(companyId, id);
    if (!source) {
      throw new Error(`Credential source with ID ${id} not found.`);
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
        throw new Error(`Credential source with name "${dto.name}" already exists.`);
      }
    }

    if (dto.slug) {
      const existingSlug = await this.repository.findCredentialSourceBySlug(
        companyId,
        dto.slug
      );
      if (existingSlug && existingSlug.id !== id) {
        throw new Error(`Credential source with slug "${dto.slug}" already exists.`);
      }
    }

    const result = await this.repository.updateCredentialSource(
      companyId,
      id,
      dto
    );
    if (result.count === 0) {
      throw new Error(`Failed to update credential source with ID ${id}.`);
    }

    return this.getCredentialSourceById(companyId, id);
  }

  async deleteCredentialSource(companyId: number, id: number) {
    const source = await this.getCredentialSourceById(companyId, id);

    if (source.isSystem) {
      throw new Error(`System credential sources cannot be deleted.`);
    }

    const usageCount = await this.repository.countCredentialSourceUsages(
      companyId,
      id
    );
    if (usageCount > 0) {
      throw new Error(
        `Cannot delete credential source because it is referenced in ${usageCount} external certificate(s).`
      );
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
      throw new Error(`Provider type with name "${dto.name}" already exists.`);
    }

    const existingSlug = await this.repository.findProviderTypeBySlug(
      companyId,
      dto.slug
    );
    if (existingSlug) {
      throw new Error(`Provider type with slug "${dto.slug}" already exists.`);
    }

    return this.repository.createProviderType(companyId, dto);
  }

  async getProviderTypeById(companyId: number, id: number) {
    const provider = await this.repository.findProviderTypeById(companyId, id);
    if (!provider) {
      throw new Error(`Provider type with ID ${id} not found.`);
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
        throw new Error(`Provider type with name "${dto.name}" already exists.`);
      }
    }

    if (dto.slug) {
      const existingSlug = await this.repository.findProviderTypeBySlug(
        companyId,
        dto.slug
      );
      if (existingSlug && existingSlug.id !== id) {
        throw new Error(`Provider type with slug "${dto.slug}" already exists.`);
      }
    }

    const result = await this.repository.updateProviderType(
      companyId,
      id,
      dto
    );
    if (result.count === 0) {
      throw new Error(`Failed to update provider type with ID ${id}.`);
    }

    return this.getProviderTypeById(companyId, id);
  }

  async deleteProviderType(companyId: number, id: number) {
    const provider = await this.getProviderTypeById(companyId, id);

    if (provider.isSystem) {
      throw new Error(`System provider types cannot be deleted.`);
    }

    const usageCount = await this.repository.countProviderTypeUsages(
      companyId,
      id
    );
    if (usageCount > 0) {
      throw new Error(
        `Cannot delete provider type because it is referenced in ${usageCount} external provider(s).`
      );
    }

    return this.repository.softDeleteProviderType(companyId, id);
  }

  // ==========================================
  // 4. CertificateTemplate Operations
  // ==========================================

  async createTemplate(
    companyId: number,
    userId: number,
    dto: CreateCertificateTemplateInput
  ) {
    const certType = await this.repository.findCertificateTypeById(
      companyId,
      dto.certificateTypeId
    );
    if (!certType) {
      throw new Error(
        `Certificate type with ID ${dto.certificateTypeId} does not exist.`
      );
    }

    const existingName = await this.repository.findTemplateByName(
      companyId,
      dto.name
    );
    if (existingName) {
      throw new Error(`Template with name "${dto.name}" already exists.`);
    }

    return this.repository.createTemplate(companyId, userId, dto);
  }

  async getTemplateById(companyId: number, id: number) {
    const template = await this.repository.findTemplateById(companyId, id);
    if (!template) {
      throw new Error(`Certificate template with ID ${id} not found.`);
    }
    return template;
  }

  async getTemplates(
    companyId: number,
    query: CertificateTemplateFilterInput
  ) {
    return this.repository.findTemplates(companyId, query);
  }

  async updateTemplate(
    companyId: number,
    id: number,
    userId: number,
    dto: UpdateCertificateTemplateInput
  ) {
    await this.getTemplateById(companyId, id);

    if (dto.certificateTypeId) {
      const certType = await this.repository.findCertificateTypeById(
        companyId,
        dto.certificateTypeId
      );
      if (!certType) {
        throw new Error(
          `Certificate type with ID ${dto.certificateTypeId} does not exist.`
        );
      }
    }

    if (dto.name) {
      const existingName = await this.repository.findTemplateByName(
        companyId,
        dto.name
      );
      if (existingName && existingName.id !== id) {
        throw new Error(`Template with name "${dto.name}" already exists.`);
      }
    }

    const result = await this.repository.updateTemplate(
      companyId,
      id,
      userId,
      dto
    );
    if (result.count === 0) {
      throw new Error(`Failed to update template with ID ${id}.`);
    }

    return this.getTemplateById(companyId, id);
  }

  async deleteTemplate(companyId: number, id: number) {
    await this.getTemplateById(companyId, id);

    const usageCount = await this.repository.countTemplateUsages(
      companyId,
      id
    );
    if (usageCount > 0) {
      throw new Error(
        `Cannot delete template because ${usageCount} active certificate(s) have been issued with it.`
      );
    }

    return this.repository.softDeleteTemplate(companyId, id);
  }

  // ==========================================
  // 5. CertificateTemplateSigner Operations
  // ==========================================

  async addSigner(
    companyId: number,
    templateId: number,
    dto: CreateCertificateTemplateSignerInput
  ) {
    await this.getTemplateById(companyId, templateId);

    const existingEmployeeSigner = await this.repository.findSignerByEmployee(
      companyId,
      templateId,
      dto.employeeId
    );
    if (existingEmployeeSigner) {
      throw new Error(
        `Employee ID "${dto.employeeId}" is already assigned as a signer for this template.`
      );
    }

    const existingOrderSigner = await this.repository.findSignerByOrder(
      companyId,
      templateId,
      dto.displayOrder
    );
    if (existingOrderSigner) {
      throw new Error(
        `Display order ${dto.displayOrder} is already occupied for this template.`
      );
    }

    return this.repository.createSigner(companyId, templateId, dto);
  }

  async getSigners(companyId: number, templateId: number) {
    await this.getTemplateById(companyId, templateId);
    return this.repository.findSigners(companyId, templateId);
  }

  async updateSigner(
    companyId: number,
    templateId: number,
    signerId: number,
    dto: UpdateCertificateTemplateSignerInput
  ) {
    await this.getTemplateById(companyId, templateId);

    const existingSigner = await this.repository.findSignerById(
      companyId,
      signerId
    );
    if (!existingSigner || existingSigner.templateId !== templateId) {
      throw new Error(`Signer with ID ${signerId} not found for this template.`);
    }

    if (dto.employeeId && dto.employeeId !== existingSigner.employeeId) {
      const duplicateEmp = await this.repository.findSignerByEmployee(
        companyId,
        templateId,
        dto.employeeId
      );
      if (duplicateEmp) {
        throw new Error(
          `Employee ID "${dto.employeeId}" is already assigned as a signer for this template.`
        );
      }
    }

    if (
      dto.displayOrder !== undefined &&
      dto.displayOrder !== existingSigner.displayOrder
    ) {
      const duplicateOrder = await this.repository.findSignerByOrder(
        companyId,
        templateId,
        dto.displayOrder
      );
      if (duplicateOrder) {
        throw new Error(
          `Display order ${dto.displayOrder} is already occupied for this template.`
        );
      }
    }

    const result = await this.repository.updateSigner(
      companyId,
      signerId,
      dto
    );
    if (result.count === 0) {
      throw new Error(`Failed to update signer with ID ${signerId}.`);
    }

    return this.repository.findSignerById(companyId, signerId);
  }

  async deleteSigner(
    companyId: number,
    templateId: number,
    signerId: number
  ) {
    await this.getTemplateById(companyId, templateId);

    const existingSigner = await this.repository.findSignerById(
      companyId,
      signerId
    );
    if (!existingSigner || existingSigner.templateId !== templateId) {
      throw new Error(`Signer with ID ${signerId} not found for this template.`);
    }

    return this.repository.deleteSigner(companyId, signerId);
  }
}
