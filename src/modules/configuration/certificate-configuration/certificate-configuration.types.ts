import { z } from "zod";
import {
  PaginationQuerySchema,
  CreateCertificateTypeSchema,
  UpdateCertificateTypeSchema,
  CertificateTypeFilterSchema,
  CreateCredentialSourceSchema,
  UpdateCredentialSourceSchema,
  CredentialSourceFilterSchema,
  CreateProviderTypeSchema,
  UpdateProviderTypeSchema,
  ProviderTypeFilterSchema,
} from "./certificate-configuration.dto.js";

import type {
  Prisma,
  CertificateType,
  CredentialSource,
  ProviderType,
} from "@prisma/client";

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export type CreateCertificateTypeInput = z.infer<typeof CreateCertificateTypeSchema>;
export type UpdateCertificateTypeInput = z.infer<typeof UpdateCertificateTypeSchema>;
export type CertificateTypeFilterInput = z.infer<typeof CertificateTypeFilterSchema>;
export interface CertificateTypeFilterParams extends PaginationQuery {
  search?: string;
  isActive?: boolean;
  isSystem?: boolean;
}

export type CreateCredentialSourceInput = z.infer<typeof CreateCredentialSourceSchema>;
export type UpdateCredentialSourceInput = z.infer<typeof UpdateCredentialSourceSchema>;
export type CredentialSourceFilterInput = z.infer<typeof CredentialSourceFilterSchema>;
export interface CredentialSourceFilterParams extends PaginationQuery {
  search?: string;
  isActive?: boolean;
  isSystem?: boolean;
}

export type CreateProviderTypeInput = z.infer<typeof CreateProviderTypeSchema>;
export type UpdateProviderTypeInput = z.infer<typeof UpdateProviderTypeSchema>;
export type ProviderTypeFilterInput = z.infer<typeof ProviderTypeFilterSchema>;
export interface ProviderTypeFilterParams extends PaginationQuery {
  search?: string;
  isActive?: boolean;
  isSystem?: boolean;
}

// ─── Repository Interface ──────────────────────────────────
export interface ICertificateConfigurationRepository {
  // 1. CertificateType Methods
  createCertificateType(companyId: number, data: CreateCertificateTypeInput): Promise<CertificateType>;
  findCertificateTypeById(companyId: number, id: number): Promise<CertificateType | null>;
  findCertificateTypeByName(companyId: number, name: string): Promise<CertificateType | null>;
  findCertificateTypeBySlug(companyId: number, slug: string): Promise<CertificateType | null>;
  findCertificateTypes(companyId: number, query: CertificateTypeFilterParams): Promise<{ data: CertificateType[]; meta: { total: number; page: number; limit: number; totalPages: number } }>;
  countCertificateTypes(companyId: number, query?: Prisma.CertificateTypeWhereInput): Promise<number>;
  updateCertificateType(companyId: number, id: number, data: UpdateCertificateTypeInput): Promise<Prisma.BatchPayload>;
  softDeleteCertificateType(companyId: number, id: number): Promise<Prisma.BatchPayload>;
  countCertificateTypeUsages(companyId: number, id: number): Promise<number>;

  // 2. CredentialSource Methods
  createCredentialSource(companyId: number, data: CreateCredentialSourceInput): Promise<CredentialSource>;
  findCredentialSourceById(companyId: number, id: number): Promise<CredentialSource | null>;
  findCredentialSourceByName(companyId: number, name: string): Promise<CredentialSource | null>;
  findCredentialSourceBySlug(companyId: number, slug: string): Promise<CredentialSource | null>;
  findCredentialSources(companyId: number, query: CredentialSourceFilterParams): Promise<{ data: CredentialSource[]; meta: { total: number; page: number; limit: number; totalPages: number } }>;
  countCredentialSources(companyId: number, query?: Prisma.CredentialSourceWhereInput): Promise<number>;
  updateCredentialSource(companyId: number, id: number, data: UpdateCredentialSourceInput): Promise<Prisma.BatchPayload>;
  softDeleteCredentialSource(companyId: number, id: number): Promise<Prisma.BatchPayload>;
  countCredentialSourceUsages(companyId: number, id: number): Promise<number>;

  // 3. ProviderType Methods
  createProviderType(companyId: number, data: CreateProviderTypeInput): Promise<ProviderType>;
  findProviderTypeById(companyId: number, id: number): Promise<ProviderType | null>;
  findProviderTypeByName(companyId: number, name: string): Promise<ProviderType | null>;
  findProviderTypeBySlug(companyId: number, slug: string): Promise<ProviderType | null>;
  findProviderTypes(companyId: number, query: ProviderTypeFilterParams): Promise<{ data: ProviderType[]; meta: { total: number; page: number; limit: number; totalPages: number } }>;
  countProviderTypes(companyId: number, query?: Prisma.ProviderTypeWhereInput): Promise<number>;
  updateProviderType(companyId: number, id: number, data: UpdateProviderTypeInput): Promise<Prisma.BatchPayload>;
  softDeleteProviderType(companyId: number, id: number): Promise<Prisma.BatchPayload>;
  countProviderTypeUsages(companyId: number, id: number): Promise<number>;

}
