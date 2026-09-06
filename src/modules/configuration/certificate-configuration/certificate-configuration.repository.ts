import type {
  PrismaClient,
  Prisma,
  CertificateType,
  CredentialSource,
  ProviderType,
  CertificateTemplateSigner,
} from "@prisma/client";
import type {
  CreateCertificateTypeInput,
  UpdateCertificateTypeInput,
  CertificateTypeFilterParams,
  CreateCredentialSourceInput,
  UpdateCredentialSourceInput,
  CredentialSourceFilterParams,
  CreateProviderTypeInput,
  UpdateProviderTypeInput,
  ProviderTypeFilterParams,
} from "./certificate-configuration.types.js";

import type { ICertificateConfigurationRepository } from "./certificate-configuration.types.js";

export class CertificateConfigurationRepository implements ICertificateConfigurationRepository {
  constructor(private prisma: PrismaClient) {}

  // ==========================================
  // 1. CertificateType Methods
  // ==========================================

  async createCertificateType(
    companyId: number,
    data: CreateCertificateTypeInput,
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
    query: CertificateTypeFilterParams,
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
    data: UpdateCertificateTypeInput,
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
    data: CreateCredentialSourceInput,
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
    query: CredentialSourceFilterParams,
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
    data: UpdateCredentialSourceInput,
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
    data: CreateProviderTypeInput,
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

  async findProviderTypes(companyId: number, query: ProviderTypeFilterParams) {
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
    data: UpdateProviderTypeInput,
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

  // TEMPLATE METHODS REMOVED — moved to template-management module
  // (templateExists retained for signer validation)
  async templateExists(companyId: number, id: number): Promise<boolean> {
    const found = await this.prisma.certificateTemplate.findFirst({
      where: { id, companyId, deletedAt: null },
      select: { id: true },
    });
    return found !== null;
  }
}
