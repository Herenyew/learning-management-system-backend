import {
  PrismaClient,
  Prisma,
  CertificateType,
  CredentialSource,
  ProviderType,
  CertificateTemplate,
  CertificateTemplateSigner,
} from "@prisma/client";
import {
  CreateCertificateTypeDto,
  UpdateCertificateTypeDto,
  CertificateTypeFilterDto,
  CreateCredentialSourceDto,
  UpdateCredentialSourceDto,
  CredentialSourceFilterDto,
  CreateProviderTypeDto,
  UpdateProviderTypeDto,
  ProviderTypeFilterDto,
  CreateCertificateTemplateDto,
  UpdateCertificateTemplateDto,
  CertificateTemplateFilterDto,
  CreateCertificateTemplateSignerDto,
  UpdateCertificateTemplateSignerDto,
} from "./certificate-configuration.dto.js";

export interface ICertificateConfigurationRepository {
  // ==========================================
  // 1. CertificateType Methods
  // ==========================================
  createCertificateType(
    companyId: number,
    data: CreateCertificateTypeDto,
  ): Promise<CertificateType>;

  findCertificateTypeById(
    companyId: number,
    id: number,
  ): Promise<CertificateType | null>;

  findCertificateTypeByName(
    companyId: number,
    name: string,
  ): Promise<CertificateType | null>;

  findCertificateTypeBySlug(
    companyId: number,
    slug: string,
  ): Promise<CertificateType | null>;

  findCertificateTypes(
    companyId: number,
    query: CertificateTypeFilterDto,
  ): Promise<{
    data: CertificateType[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>;

  countCertificateTypes(
    companyId: number,
    query?: Prisma.CertificateTypeWhereInput,
  ): Promise<number>;

  updateCertificateType(
    companyId: number,
    id: number,
    data: UpdateCertificateTypeDto,
  ): Promise<Prisma.BatchPayload>;

  softDeleteCertificateType(
    companyId: number,
    id: number,
  ): Promise<Prisma.BatchPayload>;

  countCertificateTypeUsages(companyId: number, id: number): Promise<number>;

  // ==========================================
  // 2. CredentialSource Methods
  // ==========================================
  createCredentialSource(
    companyId: number,
    data: CreateCredentialSourceDto,
  ): Promise<CredentialSource>;

  findCredentialSourceById(
    companyId: number,
    id: number,
  ): Promise<CredentialSource | null>;

  findCredentialSourceByName(
    companyId: number,
    name: string,
  ): Promise<CredentialSource | null>;

  findCredentialSourceBySlug(
    companyId: number,
    slug: string,
  ): Promise<CredentialSource | null>;

  findCredentialSources(
    companyId: number,
    query: CredentialSourceFilterDto,
  ): Promise<{
    data: CredentialSource[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>;

  countCredentialSources(
    companyId: number,
    query?: Prisma.CredentialSourceWhereInput,
  ): Promise<number>;

  updateCredentialSource(
    companyId: number,
    id: number,
    data: UpdateCredentialSourceDto,
  ): Promise<Prisma.BatchPayload>;

  softDeleteCredentialSource(
    companyId: number,
    id: number,
  ): Promise<Prisma.BatchPayload>;

  countCredentialSourceUsages(companyId: number, id: number): Promise<number>;

  // ==========================================
  // 3. ProviderType Methods
  // ==========================================
  createProviderType(
    companyId: number,
    data: CreateProviderTypeDto,
  ): Promise<ProviderType>;

  findProviderTypeById(
    companyId: number,
    id: number,
  ): Promise<ProviderType | null>;

  findProviderTypeByName(
    companyId: number,
    name: string,
  ): Promise<ProviderType | null>;

  findProviderTypeBySlug(
    companyId: number,
    slug: string,
  ): Promise<ProviderType | null>;

  findProviderTypes(
    companyId: number,
    query: ProviderTypeFilterDto,
  ): Promise<{
    data: ProviderType[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>;

  countProviderTypes(
    companyId: number,
    query?: Prisma.ProviderTypeWhereInput,
  ): Promise<number>;

  updateProviderType(
    companyId: number,
    id: number,
    data: UpdateProviderTypeDto,
  ): Promise<Prisma.BatchPayload>;

  softDeleteProviderType(
    companyId: number,
    id: number,
  ): Promise<Prisma.BatchPayload>;

  countProviderTypeUsages(companyId: number, id: number): Promise<number>;

  // ==========================================
  // 4. CertificateTemplate Methods
  // ==========================================
  createTemplate(
    companyId: number,
    userId: number,
    data: CreateCertificateTemplateDto,
  ): Promise<CertificateTemplate>;

  findTemplateById(
    companyId: number,
    id: number,
  ): Promise<CertificateTemplate | null>;

  findTemplateByName(
    companyId: number,
    name: string,
  ): Promise<CertificateTemplate | null>;

  findTemplates(
    companyId: number,
    query: CertificateTemplateFilterDto,
  ): Promise<{
    data: CertificateTemplate[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>;

  countTemplates(
    companyId: number,
    query?: Prisma.CertificateTemplateWhereInput,
  ): Promise<number>;

  updateTemplate(
    companyId: number,
    id: number,
    userId: number,
    data: UpdateCertificateTemplateDto,
  ): Promise<Prisma.BatchPayload>;

  softDeleteTemplate(
    companyId: number,
    id: number,
  ): Promise<Prisma.BatchPayload>;

  countTemplateUsages(companyId: number, id: number): Promise<number>;

  // ==========================================
  // 5. CertificateTemplateSigner Methods
  // ==========================================
  createSigner(
    companyId: number,
    templateId: number,
    data: CreateCertificateTemplateSignerDto,
  ): Promise<CertificateTemplateSigner>;

  findSignerById(
    companyId: number,
    id: number,
  ): Promise<CertificateTemplateSigner | null>;

  findSignerByOrder(
    companyId: number,
    templateId: number,
    displayOrder: number,
  ): Promise<CertificateTemplateSigner | null>;

  findSignerByEmployee(
    companyId: number,
    templateId: number,
    employeeId: string,
  ): Promise<CertificateTemplateSigner | null>;

  findSigners(
    companyId: number,
    templateId: number,
  ): Promise<CertificateTemplateSigner[]>;

  updateSigner(
    companyId: number,
    id: number,
    data: UpdateCertificateTemplateSignerDto,
  ): Promise<Prisma.BatchPayload>;

  deleteSigner(companyId: number, id: number): Promise<Prisma.BatchPayload>;
}

export class CertificateConfigurationRepository implements ICertificateConfigurationRepository {
  constructor(private prisma: PrismaClient) {}

  // ==========================================
  // 1. CertificateType Methods
  // ==========================================

  async createCertificateType(
    companyId: number,
    data: CreateCertificateTypeDto,
  ): Promise<CertificateType> {
    return this.prisma.certificateType.create({
      data: {
        companyId,
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        isSystem: data.isSystem ?? false,
      },
    });
  }

  async findCertificateTypeById(
    companyId: number,
    id: number,
  ): Promise<CertificateType | null> {
    return this.prisma.certificateType.findFirst({
      where: { id, companyId },
    });
  }

  async findCertificateTypeByName(
    companyId: number,
    name: string,
  ): Promise<CertificateType | null> {
    return this.prisma.certificateType.findFirst({
      where: {
        companyId,
        name: { equals: name, mode: "insensitive" },
      },
    });
  }

  async findCertificateTypeBySlug(
    companyId: number,
    slug: string,
  ): Promise<CertificateType | null> {
    return this.prisma.certificateType.findFirst({
      where: { companyId, slug },
    });
  }

  async findCertificateTypes(
    companyId: number,
    query: CertificateTypeFilterDto,
  ) {
    const {
      search,
      isActive,
      isSystem,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CertificateTypeWhereInput = {
      companyId,
      ...(isActive !== undefined && { isActive }),
      ...(isSystem !== undefined && { isSystem }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { slug: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.certificateType.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.certificateType.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async countCertificateTypes(
    companyId: number,
    query?: Prisma.CertificateTypeWhereInput,
  ): Promise<number> {
    return this.prisma.certificateType.count({
      where: { companyId, ...query },
    });
  }

  async updateCertificateType(
    companyId: number,
    id: number,
    data: UpdateCertificateTypeDto,
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.certificateType.updateMany({
      where: { id, companyId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.isSystem !== undefined && { isSystem: data.isSystem }),
      },
    });
  }

  async softDeleteCertificateType(
    companyId: number,
    id: number,
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.certificateType.updateMany({
      where: { id, companyId },
      data: { isActive: false },
    });
  }

  async countCertificateTypeUsages(
    companyId: number,
    id: number,
  ): Promise<number> {
    return this.prisma.certificateTemplate.count({
      where: { companyId, certificateTypeId: id, deletedAt: null },
    });
  }

  // ==========================================
  // 2. CredentialSource Methods
  // ==========================================

  async createCredentialSource(
    companyId: number,
    data: CreateCredentialSourceDto,
  ): Promise<CredentialSource> {
    return this.prisma.credentialSource.create({
      data: {
        companyId,
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        isSystem: data.isSystem ?? false,
      },
    });
  }

  async findCredentialSourceById(
    companyId: number,
    id: number,
  ): Promise<CredentialSource | null> {
    return this.prisma.credentialSource.findFirst({
      where: { id, companyId },
    });
  }

  async findCredentialSourceByName(
    companyId: number,
    name: string,
  ): Promise<CredentialSource | null> {
    return this.prisma.credentialSource.findFirst({
      where: {
        companyId,
        name: { equals: name, mode: "insensitive" },
      },
    });
  }

  async findCredentialSourceBySlug(
    companyId: number,
    slug: string,
  ): Promise<CredentialSource | null> {
    return this.prisma.credentialSource.findFirst({
      where: { companyId, slug },
    });
  }

  async findCredentialSources(
    companyId: number,
    query: CredentialSourceFilterDto,
  ) {
    const {
      search,
      isActive,
      isSystem,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CredentialSourceWhereInput = {
      companyId,
      ...(isActive !== undefined && { isActive }),
      ...(isSystem !== undefined && { isSystem }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { slug: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.credentialSource.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.credentialSource.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async countCredentialSources(
    companyId: number,
    query?: Prisma.CredentialSourceWhereInput,
  ): Promise<number> {
    return this.prisma.credentialSource.count({
      where: { companyId, ...query },
    });
  }

  async updateCredentialSource(
    companyId: number,
    id: number,
    data: UpdateCredentialSourceDto,
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.credentialSource.updateMany({
      where: { id, companyId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.isSystem !== undefined && { isSystem: data.isSystem }),
      },
    });
  }

  async softDeleteCredentialSource(
    companyId: number,
    id: number,
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.credentialSource.updateMany({
      where: { id, companyId },
      data: { isActive: false },
    });
  }

  async countCredentialSourceUsages(
    companyId: number,
    id: number,
  ): Promise<number> {
    return this.prisma.externalCertificate.count({
      where: { companyId, sourceId: id },
    });
  }

  // ==========================================
  // 3. ProviderType Methods
  // ==========================================

  async createProviderType(
    companyId: number,
    data: CreateProviderTypeDto,
  ): Promise<ProviderType> {
    return this.prisma.providerType.create({
      data: {
        companyId,
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        isSystem: data.isSystem ?? false,
      },
    });
  }

  async findProviderTypeById(
    companyId: number,
    id: number,
  ): Promise<ProviderType | null> {
    return this.prisma.providerType.findFirst({
      where: { id, companyId },
    });
  }

  async findProviderTypeByName(
    companyId: number,
    name: string,
  ): Promise<ProviderType | null> {
    return this.prisma.providerType.findFirst({
      where: {
        companyId,
        name: { equals: name, mode: "insensitive" },
      },
    });
  }

  async findProviderTypeBySlug(
    companyId: number,
    slug: string,
  ): Promise<ProviderType | null> {
    return this.prisma.providerType.findFirst({
      where: { companyId, slug },
    });
  }

  async findProviderTypes(companyId: number, query: ProviderTypeFilterDto) {
    const {
      search,
      isActive,
      isSystem,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProviderTypeWhereInput = {
      companyId,
      ...(isActive !== undefined && { isActive }),
      ...(isSystem !== undefined && { isSystem }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { slug: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.providerType.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.providerType.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async countProviderTypes(
    companyId: number,
    query?: Prisma.ProviderTypeWhereInput,
  ): Promise<number> {
    return this.prisma.providerType.count({
      where: { companyId, ...query },
    });
  }

  async updateProviderType(
    companyId: number,
    id: number,
    data: UpdateProviderTypeDto,
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.providerType.updateMany({
      where: { id, companyId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.isSystem !== undefined && { isSystem: data.isSystem }),
      },
    });
  }

  async softDeleteProviderType(
    companyId: number,
    id: number,
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.providerType.updateMany({
      where: { id, companyId },
      data: { isActive: false },
    });
  }

  async countProviderTypeUsages(
    companyId: number,
    id: number,
  ): Promise<number> {
    return this.prisma.externalProvider.count({
      where: { companyId, providerTypeId: id },
    });
  }

  // ==========================================
  // 4. CertificateTemplate Methods
  // ==========================================

  async createTemplate(
    companyId: number,
    userId: number,
    data: CreateCertificateTemplateDto,
  ): Promise<CertificateTemplate> {
    return this.prisma.certificateTemplate.create({
      data: {
        companyId,
        createdBy: userId,
        name: data.name,
        certificateTypeId: data.certificateTypeId,
        courseVersionId: data.courseVersionId ?? null,
        learningProgramId: data.learningProgramId ?? null,
        templateFile: data.templateFile ?? null,
        certificateIdPattern: data.certificateIdPattern,
        validityMonths: data.validityMonths ?? null,
        sealImage: data.sealImage ?? null,
        qrVerificationEnabled: data.qrVerificationEnabled ?? true,
        backgroundImage: data.backgroundImage ?? null,
        status: data.status,
      },
    });
  }

  async findTemplateById(
    companyId: number,
    id: number,
  ): Promise<CertificateTemplate | null> {
    return this.prisma.certificateTemplate.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        certificateType: true,
        signers: {
          include: { employee: true },
          orderBy: { displayOrder: "asc" },
        },
      },
    });
  }

  async findTemplateByName(
    companyId: number,
    name: string,
  ): Promise<CertificateTemplate | null> {
    return this.prisma.certificateTemplate.findFirst({
      where: {
        companyId,
        name: { equals: name, mode: "insensitive" },
        deletedAt: null,
      },
    });
  }

  async findTemplates(companyId: number, query: CertificateTemplateFilterDto) {
    const {
      search,
      certificateTypeId,
      courseVersionId,
      learningProgramId,
      status,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CertificateTemplateWhereInput = {
      companyId,
      deletedAt: null,
      ...(certificateTypeId && { certificateTypeId }),
      ...(courseVersionId && { courseVersionId }),
      ...(learningProgramId && { learningProgramId }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { certificateIdPattern: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.certificateTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { certificateType: true },
      }),
      this.prisma.certificateTemplate.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async countTemplates(
    companyId: number,
    query?: Prisma.CertificateTemplateWhereInput,
  ): Promise<number> {
    return this.prisma.certificateTemplate.count({
      where: { companyId, deletedAt: null, ...query },
    });
  }

  async updateTemplate(
    companyId: number,
    id: number,
    userId: number,
    data: UpdateCertificateTemplateDto,
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.certificateTemplate.updateMany({
      where: { id, companyId, deletedAt: null },
      data: {
        updatedBy: userId,
        ...(data.name !== undefined && { name: data.name }),
        ...(data.certificateTypeId !== undefined && {
          certificateTypeId: data.certificateTypeId,
        }),
        ...(data.courseVersionId !== undefined && {
          courseVersionId: data.courseVersionId,
        }),
        ...(data.learningProgramId !== undefined && {
          learningProgramId: data.learningProgramId,
        }),
        ...(data.templateFile !== undefined && {
          templateFile: data.templateFile,
        }),
        ...(data.certificateIdPattern !== undefined && {
          certificateIdPattern: data.certificateIdPattern,
        }),
        ...(data.validityMonths !== undefined && {
          validityMonths: data.validityMonths,
        }),
        ...(data.sealImage !== undefined && { sealImage: data.sealImage }),
        ...(data.qrVerificationEnabled !== undefined && {
          qrVerificationEnabled: data.qrVerificationEnabled,
        }),
        ...(data.backgroundImage !== undefined && {
          backgroundImage: data.backgroundImage,
        }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });
  }

  async softDeleteTemplate(
    companyId: number,
    id: number,
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.certificateTemplate.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  async countTemplateUsages(companyId: number, id: number): Promise<number> {
    return this.prisma.certificate.count({
      where: { companyId, templateId: id },
    });
  }

  // ==========================================
  // 5. CertificateTemplateSigner Methods
  // ==========================================

  async createSigner(
    companyId: number,
    templateId: number,
    data: CreateCertificateTemplateSignerDto,
  ): Promise<CertificateTemplateSigner> {
    return this.prisma.certificateTemplateSigner.create({
      data: {
        companyId,
        templateId,
        employeeId: data.employeeId,
        displayOrder: data.displayOrder,
      },
    });
  }

  async findSignerById(
    companyId: number,
    id: number,
  ): Promise<CertificateTemplateSigner | null> {
    return this.prisma.certificateTemplateSigner.findFirst({
      where: { id, companyId },
      include: { employee: true },
    });
  }

  async findSignerByOrder(
    companyId: number,
    templateId: number,
    displayOrder: number,
  ): Promise<CertificateTemplateSigner | null> {
    return this.prisma.certificateTemplateSigner.findFirst({
      where: { companyId, templateId, displayOrder },
    });
  }

  async findSignerByEmployee(
    companyId: number,
    templateId: number,
    employeeId: string,
  ): Promise<CertificateTemplateSigner | null> {
    return this.prisma.certificateTemplateSigner.findFirst({
      where: { companyId, templateId, employeeId },
    });
  }

  async findSigners(
    companyId: number,
    templateId: number,
  ): Promise<CertificateTemplateSigner[]> {
    return this.prisma.certificateTemplateSigner.findMany({
      where: { companyId, templateId },
      include: { employee: true },
      orderBy: { displayOrder: "asc" },
    });
  }

  async updateSigner(
    companyId: number,
    id: number,
    data: UpdateCertificateTemplateSignerDto,
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.certificateTemplateSigner.updateMany({
      where: { id, companyId },
      data: {
        ...(data.employeeId !== undefined && { employeeId: data.employeeId }),
        ...(data.displayOrder !== undefined && {
          displayOrder: data.displayOrder,
        }),
      },
    });
  }

  async deleteSigner(
    companyId: number,
    id: number,
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.certificateTemplateSigner.deleteMany({
      where: { id, companyId },
    });
  }
}
