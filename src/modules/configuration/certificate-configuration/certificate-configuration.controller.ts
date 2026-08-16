import { Request, Response, NextFunction } from "express";
import { CertificateConfigurationService } from "./certificate-configuration.service.js";
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

export class CertificateConfigurationController {
  constructor(
    private service: CertificateConfigurationService
  ) {}

  // ==========================================
  // 1. CertificateType Handlers
  // ==========================================

  createCertificateType = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const dto: CreateCertificateTypeDto = req.body;
      const result = await this.service.createCertificateType(companyId, dto);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  listCertificateTypes = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const query = req.query as unknown as CertificateTypeFilterDto;
      const result = await this.service.getCertificateTypes(companyId, query);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  getCertificateTypeById = async (
    req: Request,
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
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const dto: UpdateCertificateTypeDto = req.body;
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
    req: Request,
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
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const dto: CreateCredentialSourceDto = req.body;
      const result = await this.service.createCredentialSource(companyId, dto);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  listCredentialSources = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const query = req.query as unknown as CredentialSourceFilterDto;
      const result = await this.service.getCredentialSources(companyId, query);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  getCredentialSourceById = async (
    req: Request,
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
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const dto: UpdateCredentialSourceDto = req.body;
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
    req: Request,
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
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const dto: CreateProviderTypeDto = req.body;
      const result = await this.service.createProviderType(companyId, dto);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  listProviderTypes = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const query = req.query as unknown as ProviderTypeFilterDto;
      const result = await this.service.getProviderTypes(companyId, query);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  getProviderTypeById = async (
    req: Request,
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
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const dto: UpdateProviderTypeDto = req.body;
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
    req: Request,
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
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.id;
      const dto: CreateCertificateTemplateDto = req.body;
      const result = await this.service.createTemplate(companyId, userId, dto);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  listTemplates = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const query = req.query as unknown as CertificateTemplateFilterDto;
      const result = await this.service.getTemplates(companyId, query);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  getTemplateById = async (
    req: Request,
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
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.id;
      const id = Number(req.params.id);
      const dto: UpdateCertificateTemplateDto = req.body;
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
    req: Request,
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
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const templateId = Number(req.params.templateId);
      const dto: CreateCertificateTemplateSignerDto = req.body;
      const result = await this.service.addSigner(companyId, templateId, dto);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  listSigners = async (
    req: Request,
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
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const templateId = Number(req.params.templateId);
      const signerId = Number(req.params.signerId);
      const dto: UpdateCertificateTemplateSignerDto = req.body;
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
    req: Request,
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