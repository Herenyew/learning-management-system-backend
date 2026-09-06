import { Router } from "express";
import { CertificateConfigurationController } from "./certificate-configuration.controller.js";
import { validateBody, validateQuery } from "../../../common/middlewares/validation.middleware.js";
import { authenticate } from "../../auth/auth.middleware.js";
import { requirePermission } from "../../../common/auth/permission.middleware.js";
import { Permissions } from "../../../common/constants/permission.constant.js";

import {
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

export function CertificateConfigurationRouter(
  controller: CertificateConfigurationController
): Router {
  const router = Router();

  // 🔒 Authenticate all requests
  router.use(authenticate);

  // ==========================================
  // 1. CertificateType Routes
  // ==========================================
  router.post(
    "/types",
    requirePermission(Permissions.CERTIFICATE_TYPE_CREATE),
    validateBody(CreateCertificateTypeSchema),
    controller.createCertificateType
  );

  router.get(
    "/types",
    requirePermission(Permissions.CERTIFICATE_TYPE_VIEW),
    validateQuery(CertificateTypeFilterSchema),
    controller.listCertificateTypes
  );

  router.get(
    "/types/:id",
    requirePermission(Permissions.CERTIFICATE_TYPE_VIEW),
    controller.getCertificateTypeById
  );

  router.patch(
    "/types/:id",
    requirePermission(Permissions.CERTIFICATE_TYPE_UPDATE),
    validateBody(UpdateCertificateTypeSchema),
    controller.updateCertificateType
  );

  router.delete(
    "/types/:id",
    requirePermission(Permissions.CERTIFICATE_TYPE_DELETE),
    controller.deleteCertificateType
  );

  // ==========================================
  // 2. CredentialSource Routes
  // ==========================================
  router.post(
    "/credential-sources",
    requirePermission(Permissions.CREDENTIAL_SOURCE_CREATE),
    validateBody(CreateCredentialSourceSchema),
    controller.createCredentialSource
  );

  router.get(
    "/credential-sources",
    requirePermission(Permissions.CREDENTIAL_SOURCE_VIEW),
    validateQuery(CredentialSourceFilterSchema),
    controller.listCredentialSources
  );

  router.get(
    "/credential-sources/:id",
    requirePermission(Permissions.CREDENTIAL_SOURCE_VIEW),
    controller.getCredentialSourceById
  );

  router.patch(
    "/credential-sources/:id",
    requirePermission(Permissions.CREDENTIAL_SOURCE_UPDATE),
    validateBody(UpdateCredentialSourceSchema),
    controller.updateCredentialSource
  );

  router.delete(
    "/credential-sources/:id",
    requirePermission(Permissions.CREDENTIAL_SOURCE_DELETE),
    controller.deleteCredentialSource
  );

  // ==========================================
  // 3. ProviderType Routes
  // ==========================================
  router.post(
    "/provider-types",
    requirePermission(Permissions.PROVIDER_TYPE_CREATE),
    validateBody(CreateProviderTypeSchema),
    controller.createProviderType
  );

  router.get(
    "/provider-types",
    requirePermission(Permissions.PROVIDER_TYPE_VIEW),
    validateQuery(ProviderTypeFilterSchema),
    controller.listProviderTypes
  );

  router.get(
    "/provider-types/:id",
    requirePermission(Permissions.PROVIDER_TYPE_VIEW),
    controller.getProviderTypeById
  );

  router.patch(
    "/provider-types/:id",
    requirePermission(Permissions.PROVIDER_TYPE_UPDATE),
    validateBody(UpdateProviderTypeSchema),
    controller.updateProviderType
  );

  router.delete(
    "/provider-types/:id",
    requirePermission(Permissions.PROVIDER_TYPE_DELETE),
    controller.deleteProviderType
  );

  return router;
}