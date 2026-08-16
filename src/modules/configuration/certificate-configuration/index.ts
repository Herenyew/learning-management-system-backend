import prisma from "../../../config/database.js";
import { CertificateConfigurationRepository } from "./certificate-configuration.repository.js";
import { CertificateConfigurationService } from "./certificate-configuration.service.js";
import { CertificateConfigurationController } from "./certificate-configuration.controller.js";
import { CertificateConfigurationRouter } from "./certificate-configuration.routes.js";

  const repository = new CertificateConfigurationRepository(prisma);
  const service = new CertificateConfigurationService(repository);
  const controller = new CertificateConfigurationController(service);
  const router = CertificateConfigurationRouter(controller);

export default router;
