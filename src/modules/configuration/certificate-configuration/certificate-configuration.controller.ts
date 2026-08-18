import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../auth-request.js";
import type { CertificateConfigurationService } from "./certificate-configuration.service.js";
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

export class CertificateConfigurationController {
  constructor(
    private service: CertificateConfigurationService
  ) {}

  // ==========================================
  // 1. CertificateType Handlers
  // ==========================================

  createCertificateType = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const dto: CreateCertificateTypeInput = req.body;
      const result = await this.service.createCertificateType(companyId, dto);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  listCertificateTypes = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const query = req.query;
      const result = await this.service.getCertificateTypes(companyId, query);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  getCertificateTypeById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const result = await this.service.getCertificateTypeById(companyId, id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  updateCertificateType = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const dto: UpdateCertificateTypeInput = req.body;
      const result = await this.service.updateCertificateType(
        companyId,
        id,
        dto
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  deleteCertificateType = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const result = await this.service.deleteCertificateType(companyId, id);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // 2. CredentialSource Handlers
  // ==========================================

  createCredentialSource = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const dto: CreateCredentialSourceInput = req.body;
      const result = await this.service.createCredentialSource(companyId, dto);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  listCredentialSources = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const query = req.query;
      const result = await this.service.getCredentialSources(companyId, query);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  getCredentialSourceById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const result = await this.service.getCredentialSourceById(companyId, id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  updateCredentialSource = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const dto: UpdateCredentialSourceInput = req.body;
      const result = await this.service.updateCredentialSource(
        companyId,
        id,
        dto
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  deleteCredentialSource = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const result = await this.service.deleteCredentialSource(companyId, id);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // 3. ProviderType Handlers
  // ==========================================

  createProviderType = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const dto: CreateProviderTypeInput = req.body;
      const result = await this.service.createProviderType(companyId, dto);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  listProviderTypes = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const query = req.query;
      const result = await this.service.getProviderTypes(companyId, query);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  getProviderTypeById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const result = await this.service.getProviderTypeById(companyId, id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  updateProviderType = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const dto: UpdateProviderTypeInput = req.body;
      const result = await this.service.updateProviderType(
        companyId,
        id,
        dto
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  deleteProviderType = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const result = await this.service.deleteProviderType(companyId, id);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // 4. CertificateTemplate Handlers
  // ==========================================

  createTemplate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.appUserId;
      const dto: CreateCertificateTemplateInput = req.body;
      const result = await this.service.createTemplate(companyId, userId, dto);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  listTemplates = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const query = req.query;
      const result = await this.service.getTemplates(companyId, query);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  getTemplateById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const result = await this.service.getTemplateById(companyId, id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  updateTemplate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.appUserId;
      const id = Number(req.params.id);
      const dto: UpdateCertificateTemplateInput = req.body;
      const result = await this.service.updateTemplate(
        companyId,
        id,
        userId,
        dto
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  deleteTemplate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const result = await this.service.deleteTemplate(companyId, id);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // 5. CertificateTemplateSigner Handlers
  // ==========================================

  addSigner = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const templateId = Number(req.params.templateId);
      const dto: CreateCertificateTemplateSignerInput = req.body;
      const result = await this.service.addSigner(companyId, templateId, dto);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  listSigners = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const templateId = Number(req.params.templateId);
      const result = await this.service.getSigners(companyId, templateId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  updateSigner = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const templateId = Number(req.params.templateId);
      const signerId = Number(req.params.signerId);
      const dto: UpdateCertificateTemplateSignerInput = req.body;
      const result = await this.service.updateSigner(
        companyId,
        templateId,
        signerId,
        dto
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  deleteSigner = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const templateId = Number(req.params.templateId);
      const signerId = Number(req.params.signerId);
      const result = await this.service.deleteSigner(
        companyId,
        templateId,
        signerId
      );
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };
}
