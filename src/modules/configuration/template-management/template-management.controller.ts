import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../auth-request.js";
import type { TemplateManagementService } from "./template-management.service.js";
import type {
  CourseTemplateFilterQuery,
  ProgramTemplateQueryInput,
  AssessmentTemplateFilterInput,
  CreateSurveyTemplateQuestionInput,
  UpdateSurveyTemplateQuestionInput,
  ReorderSurveyTemplateQuestionsInput,
  CertificateTemplateFilterInput,
  CreateCertificateTemplateSignerInput,
  UpdateCertificateTemplateSignerInput,
  NotificationTemplateFilterInput,
} from "./template-management.dto.js";

export class TemplateManagementController {
  constructor(private readonly service: TemplateManagementService) {}

  // ─── 1. Course Templates ───────────────────────────────────────────────────

  createCourseTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.createCourseTemplate(
        req.user.companyId,
        req.user.appUserId!,
        req.body,
      );
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  getCourseTemplateById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getCourseTemplateById(
        req.user.companyId,
        Number(req.params.id),
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  listCourseTemplates = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const filter = req.query as unknown as CourseTemplateFilterQuery;
      const page = filter.page ?? 1;
      const pageSize = filter.pageSize ?? 10;
      const result = await this.service.listCourseTemplates(
        req.user.companyId,
        filter,
        page,
        pageSize,
      );
      res.json({ success: true, data: result.items, pagination: { total: result.total, page: result.page, pageSize: result.pageSize } });
    } catch (err) {
      next(err);
    }
  };

  updateCourseTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.updateCourseTemplate(
        req.user.companyId,
        Number(req.params.id),
        req.user.appUserId!,
        req.body,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  deleteCourseTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteCourseTemplate(req.user.companyId, Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  // ─── 2. Program Templates ──────────────────────────────────────────────────

  createProgramTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.createProgramTemplate(
        req.user.companyId,
        req.user.appUserId!,
        req.body,
      );
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  getProgramTemplateById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getProgramTemplateById(
        req.user.companyId,
        Number(req.params.id),
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  listProgramTemplates = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const query = req.query as unknown as ProgramTemplateQueryInput;
      const result = await this.service.listProgramTemplates(req.user.companyId, query);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  updateProgramTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.updateProgramTemplate(
        req.user.companyId,
        Number(req.params.id),
        req.user.appUserId!,
        req.body,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  deleteProgramTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteProgramTemplate(req.user.companyId, Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  // ─── 3. Assessment Templates ───────────────────────────────────────────────

  createAssessmentTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.createAssessmentTemplate(
        req.user.companyId,
        req.user.appUserId!,
        req.body,
      );
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  getAssessmentTemplateById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getAssessmentTemplateById(
        req.user.companyId,
        Number(req.params.id),
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  listAssessmentTemplates = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const filter = req.query as unknown as AssessmentTemplateFilterInput;
      const result = await this.service.listAssessmentTemplates(
        req.user.companyId,
        filter,
      );
      res.json({ success: true, data: result.items, pagination: { total: result.total, page: result.page, pageSize: result.pageSize } });
    } catch (err) {
      next(err);
    }
  };

  updateAssessmentTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.updateAssessmentTemplate(
        req.user.companyId,
        Number(req.params.id),
        req.user.appUserId!,
        req.body,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  deleteAssessmentTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteAssessmentTemplate(req.user.companyId, Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  // ─── 4. Survey Templates (+ dynamic question builder) ──────────────────────

  createSurveyTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.createSurveyTemplate(
        req.user.companyId,
        req.user.appUserId!,
        req.body,
      );
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  getSurveyTemplateById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getSurveyTemplateById(
        req.user.companyId,
        Number(req.params.id),
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  listSurveyTemplates = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const query = req.query as unknown as {
        page?: number;
        pageSize?: number;
        search?: string;
        isActive?: boolean;
        surveyType?: string;
        kirkpatrickLevel?: string;
      };
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 10;
      const result = await this.service.listSurveyTemplates(req.user.companyId, { ...query, page, pageSize });
      res.json({ success: true, data: result.items, pagination: { total: result.total, page: result.page, pageSize: result.pageSize } });
    } catch (err) {
      next(err);
    }
  };

  updateSurveyTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.updateSurveyTemplate(
        req.user.companyId,
        Number(req.params.id),
        req.user.appUserId!,
        req.body,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  deleteSurveyTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteSurveyTemplate(req.user.companyId, Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  createSurveyTemplateQuestion = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const templateId = Number(req.params.templateId);
      const result = await this.service.createSurveyTemplateQuestion(
        req.user.companyId,
        templateId,
        req.body,
      );
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  getSurveyTemplateQuestions = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const templateId = Number(req.params.templateId);
      const result = await this.service.getSurveyTemplateQuestions(
        req.user.companyId,
        templateId,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  getSurveyTemplateQuestionById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const templateId = Number(req.params.templateId);
      const questionId = Number(req.params.questionId);
      const result = await this.service.getSurveyTemplateQuestionById(
        req.user.companyId,
        templateId,
        questionId,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  updateSurveyTemplateQuestion = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const templateId = Number(req.params.templateId);
      const questionId = Number(req.params.questionId);
      const result = await this.service.updateSurveyTemplateQuestion(
        req.user.companyId,
        templateId,
        questionId,
        req.body,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  deleteSurveyTemplateQuestion = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const templateId = Number(req.params.templateId);
      const questionId = Number(req.params.questionId);
      await this.service.deleteSurveyTemplateQuestion(
        req.user.companyId,
        templateId,
        questionId,
      );
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  reorderSurveyTemplateQuestions = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const templateId = Number(req.params.templateId);
      const result = await this.service.reorderSurveyTemplateQuestions(
        req.user.companyId,
        templateId,
        req.body,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  // ─── 5. Certificate Templates (+ signers) ──────────────────────────────────

  createCertificateTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.createCertificateTemplate(
        req.user.companyId,
        req.user.appUserId!,
        req.body,
      );
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  getCertificateTemplateById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getCertificateTemplateById(
        req.user.companyId,
        Number(req.params.id),
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  listCertificateTemplates = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const query = req.query as unknown as CertificateTemplateFilterInput;
      const result = await this.service.listCertificateTemplates(req.user.companyId, query);
      res.json({ success: true, data: result.data, pagination: result.meta });
    } catch (err) {
      next(err);
    }
  };

  updateCertificateTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.updateCertificateTemplate(
        req.user.companyId,
        Number(req.params.id),
        req.user.appUserId!,
        req.body,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  deleteCertificateTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteCertificateTemplate(req.user.companyId, Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  createCertificateTemplateSigner = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.addCertificateTemplateSigner(
        req.user.companyId,
        Number(req.params.templateId),
        req.body,
      );
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  getCertificateTemplateSigners = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getCertificateTemplateSigners(
        req.user.companyId,
        Number(req.params.templateId),
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  updateCertificateTemplateSigner = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.updateCertificateTemplateSigner(
        req.user.companyId,
        Number(req.params.templateId),
        Number(req.params.signerId),
        req.body,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  deleteCertificateTemplateSigner = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteCertificateTemplateSigner(
        req.user.companyId,
        Number(req.params.templateId),
        Number(req.params.signerId),
      );
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  // ─── 6. Notification Templates ─────────────────────────────────────────────

  createNotificationTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.createNotificationTemplate(
        req.user.companyId,
        req.user.appUserId!,
        req.body,
      );
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  getNotificationTemplateById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getNotificationTemplateById(
        req.user.companyId,
        Number(req.params.id),
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  listNotificationTemplates = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const query = req.query as unknown as NotificationTemplateFilterInput;
      const result = await this.service.listNotificationTemplates(req.user.companyId, query);
      res.json({ success: true, data: result.data, pagination: result.meta });
    } catch (err) {
      next(err);
    }
  };

  updateNotificationTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.updateNotificationTemplate(
        req.user.companyId,
        Number(req.params.id),
        req.user.appUserId!,
        req.body,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  deleteNotificationTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteNotificationTemplate(req.user.companyId, Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  // ─── Helper: List Users (for owner/responsible person dropdowns) ───────────

  listUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.listUsers(req.user.companyId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  // ─── Helper: List Employees (for program template owner dropdown) ──────────

  listEmployees = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.listEmployees(req.user.companyId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };
}
