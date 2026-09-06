import type { TemplateManagementRepository } from "./template-management.repository.js";
import type {
  CreateCourseTemplateInput,
  UpdateCourseTemplateInput,
  CourseTemplateFilterQuery,
  CreateProgramTemplateInput,
  UpdateProgramTemplateInput,
  ProgramTemplateQueryInput,
  CreateAssessmentTemplateInput,
  UpdateAssessmentTemplateInput,
  AssessmentTemplateFilterInput,
  CreateSurveyTemplateInput,
  UpdateSurveyTemplateInput,
  CreateSurveyTemplateQuestionInput,
  UpdateSurveyTemplateQuestionInput,
  ReorderSurveyTemplateQuestionsInput,
  CreateCertificateTemplateInput,
  UpdateCertificateTemplateInput,
  CertificateTemplateFilterInput,
  CreateCertificateTemplateSignerInput,
  UpdateCertificateTemplateSignerInput,
  CreateNotificationTemplateInput,
  UpdateNotificationTemplateInput,
  NotificationTemplateFilterInput,
} from "./template-management.dto.js";
import { ConflictError, NotFoundError, ValidationError, BusinessRuleError } from "../../../common/errors/http-errors.js";

export class TemplateManagementService {
  constructor(private readonly repo: TemplateManagementRepository) {}

  // ─── 1. Course Templates ───────────────────────────────────────────────────

  async createCourseTemplate(companyId: number, userId: number, dto: CreateCourseTemplateInput) {
    const existing = await this.repo.findCourseTemplateByName(companyId, dto.name);
    if (existing) throw new ConflictError(`Course template with name '${dto.name}' already exists.`);
    return this.repo.createCourseTemplate(companyId, userId, dto);
  }

  async getCourseTemplateById(companyId: number, id: number) {
    const template = await this.repo.findCourseTemplateById(companyId, id);
    if (!template) throw new NotFoundError("Course template");
    return template;
  }

  async listCourseTemplates(
    companyId: number,
    filter: CourseTemplateFilterQuery,
    page: number,
    pageSize: number,
  ) {
    const [items, total] = await Promise.all([
      this.repo.findCourseTemplates(companyId, filter, page, pageSize),
      this.repo.countCourseTemplates(companyId, filter),
    ]);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async updateCourseTemplate(companyId: number, id: number, userId: number, dto: UpdateCourseTemplateInput) {
    const template = await this.getCourseTemplateById(companyId, id);
    if (dto.name && dto.name !== template.name) {
      const existing = await this.repo.findCourseTemplateByName(companyId, dto.name);
      if (existing) throw new ConflictError(`Course template with name '${dto.name}' already exists.`);
    }
    return this.repo.updateCourseTemplate(companyId, id, userId, dto);
  }

  async deleteCourseTemplate(companyId: number, id: number) {
    await this.getCourseTemplateById(companyId, id);
    const usages = await this.repo.countCourseTemplateUsages(companyId, id);
    if (usages > 0) throw new BusinessRuleError(`Cannot delete template. It is referenced by ${usages} course(s).`);
    return this.repo.softDeleteCourseTemplate(companyId, id);
  }

  // ─── 2. Program Templates ──────────────────────────────────────────────────

  async createProgramTemplate(companyId: number, userId: number, data: CreateProgramTemplateInput) {
    const existingName = await this.repo.findProgramTemplateByName(companyId, data.name);
    if (existingName) throw new ConflictError(`Program template with name '${data.name}' already exists.`);
    if (data.categoryId) {
      const category = await this.repo.findProgramCategoryById(companyId, data.categoryId);
      if (!category) throw new NotFoundError(`Category with ID ${data.categoryId} not found.`);
    }
    if (data.programTypeId) {
      const type = await this.repo.findProgramTypeById(companyId, data.programTypeId);
      if (!type) throw new NotFoundError(`Program type with ID ${data.programTypeId} not found.`);
    }
    return this.repo.createProgramTemplate(companyId, userId, data);
  }

  async getProgramTemplateById(companyId: number, id: number) {
    const template = await this.repo.findProgramTemplateById(companyId, id);
    if (!template) throw new NotFoundError(`Program template with ID ${id} not found.`);
    return template;
  }

  async listProgramTemplates(companyId: number, query: ProgramTemplateQueryInput) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const [items, total] = await Promise.all([
      this.repo.findProgramTemplates(companyId, query),
      this.repo.countProgramTemplates(companyId, query),
    ]);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async updateProgramTemplate(companyId: number, id: number, userId: number, data: UpdateProgramTemplateInput) {
    await this.getProgramTemplateById(companyId, id);
    if (data.name) {
      const existingName = await this.repo.findProgramTemplateByName(companyId, data.name);
      if (existingName && existingName.id !== id) throw new ConflictError(`Program template with name '${data.name}' already exists.`);
    }
    if (data.categoryId) {
      const category = await this.repo.findProgramCategoryById(companyId, data.categoryId);
      if (!category) throw new NotFoundError(`Category with ID ${data.categoryId} not found.`);
    }
    if (data.programTypeId) {
      const type = await this.repo.findProgramTypeById(companyId, data.programTypeId);
      if (!type) throw new NotFoundError(`Program type with ID ${data.programTypeId} not found.`);
    }
    return this.repo.updateProgramTemplate(companyId, id, userId, data);
  }

  async deleteProgramTemplate(companyId: number, id: number) {
    await this.getProgramTemplateById(companyId, id);
    const usageCount = await this.repo.countProgramTemplateUsages(companyId, id);
    if (usageCount > 0) throw new ValidationError(`Cannot delete program template. It has been used to instantiate ${usageCount} learning program(s).`);
    return this.repo.softDeleteProgramTemplate(companyId, id);
  }

  // ─── 3. Assessment Templates ───────────────────────────────────────────────

  async createAssessmentTemplate(companyId: number, userId: number, dto: CreateAssessmentTemplateInput) {
    const existing = await this.repo.findAssessmentTemplateByName(companyId, dto.name);
    if (existing) throw new ConflictError(`Assessment template with name '${dto.name}' already exists.`);
    const type = await this.repo.findAssessmentTypeById(dto.assessmentTypeId, companyId);
    if (!type) throw new NotFoundError(`Assessment type with ID ${dto.assessmentTypeId} not found.`);
    const grading = await this.repo.findGradingMethodById(dto.gradingMethodId, companyId);
    if (!grading) throw new NotFoundError(`Grading method with ID ${dto.gradingMethodId} not found.`);
    if (dto.questionBankId) {
      const qb = await this.repo.findQuestionBankById(companyId, dto.questionBankId);
      if (!qb) throw new NotFoundError(`Question bank with ID ${dto.questionBankId} not found.`);
    }
    return this.repo.createAssessmentTemplate(companyId, userId, dto);
  }

  async getAssessmentTemplateById(companyId: number, id: number) {
    const template = await this.repo.findAssessmentTemplateById(companyId, id);
    if (!template) throw new NotFoundError(`Assessment template with ID ${id} not found.`);
    return template;
  }

  async listAssessmentTemplates(companyId: number, filter: AssessmentTemplateFilterInput) {
    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 10;
    const [items, total] = await Promise.all([
      this.repo.findAssessmentTemplates(companyId, filter),
      this.repo.countAssessmentTemplates(companyId, filter),
    ]);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async updateAssessmentTemplate(companyId: number, id: number, userId: number, dto: UpdateAssessmentTemplateInput) {
    const template = await this.getAssessmentTemplateById(companyId, id);
    if (dto.name && dto.name !== template.name) {
      const duplicate = await this.repo.findAssessmentTemplateByName(companyId, dto.name);
      if (duplicate && duplicate.id !== id) throw new ConflictError(`Assessment template with name '${dto.name}' already exists.`);
    }
    if (dto.assessmentTypeId) {
      const type = await this.repo.findAssessmentTypeById(dto.assessmentTypeId, companyId);
      if (!type) throw new NotFoundError(`Assessment type with ID ${dto.assessmentTypeId} not found.`);
    }
    if (dto.gradingMethodId) {
      const grading = await this.repo.findGradingMethodById(dto.gradingMethodId, companyId);
      if (!grading) throw new NotFoundError(`Grading method with ID ${dto.gradingMethodId} not found.`);
    }
    return this.repo.updateAssessmentTemplate(companyId, id, userId, dto);
  }

  async deleteAssessmentTemplate(companyId: number, id: number) {
    await this.getAssessmentTemplateById(companyId, id);
    const usages = await this.repo.countAssessmentTemplateUsages(companyId, id);
    if (usages > 0) throw new ConflictError(`Cannot delete assessment template. It has been used by ${usages} assessment(s).`);
    return this.repo.softDeleteAssessmentTemplate(companyId, id);
  }

  // ─── 4. Survey Templates (+ dynamic question builder) ──────────────────────

  async createSurveyTemplate(companyId: number, userId: number, data: CreateSurveyTemplateInput) {
        const existingName = await this.repo.findSurveyTemplateByName(companyId, data.name);
    if (existingName) throw new ConflictError(`Survey template with name '${data.name}' already exists.`);
    if (data.questions && data.questions.length > 0) {
      for (const q of data.questions) {
        const qt = await this.repo.findSurveyQuestionTypeById(companyId, q.questionTypeId);
        if (!qt || !qt.isActive) {
          throw new NotFoundError(`Question type with ID ${q.questionTypeId} is not available.`);
        }
      }
    }
    return this.repo.createSurveyTemplate(companyId, userId, data);
  }

  async getSurveyTemplateById(companyId: number, id: number) {
    const template = await this.repo.findSurveyTemplateById(companyId, id);
    if (!template) throw new NotFoundError(`Survey template with ID ${id} not found.`);
    return template;
  }

  async listSurveyTemplates(companyId: number, query: { page?: number; pageSize?: number; search?: string; isActive?: boolean; surveyType?: string; kirkpatrickLevel?: string }) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const [items, total] = await Promise.all([
      this.repo.findSurveyTemplates(companyId, query, page, pageSize),
      this.repo.countSurveyTemplates(companyId, query),
    ]);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async updateSurveyTemplate(companyId: number, id: number, userId: number, data: UpdateSurveyTemplateInput) {
    const existing = await this.getSurveyTemplateById(companyId, id);
    if (data.name && data.name !== existing.name) {
      const duplicate = await this.repo.findSurveyTemplateByName(companyId, data.name);
      if (duplicate && duplicate.id !== id) throw new ConflictError(`Survey template with name '${data.name}' already exists.`);
    }
    if (data.questions && data.questions.length > 0) {
      for (const q of data.questions) {
        const qt = await this.repo.findSurveyQuestionTypeById(companyId, q.questionTypeId);
        if (!qt || !qt.isActive) {
          throw new NotFoundError(`Question type with ID ${q.questionTypeId} is not available.`);
        }
      }
    }
    return this.repo.updateSurveyTemplate(companyId, id, userId, data);
  }

  async deleteSurveyTemplate(companyId: number, id: number) {
    await this.getSurveyTemplateById(companyId, id);
    return this.repo.softDeleteSurveyTemplate(companyId, id);
  }

  async createSurveyTemplateQuestion(companyId: number, templateId: number, data: CreateSurveyTemplateQuestionInput) {
    await this.getSurveyTemplateById(companyId, templateId);
    const qt = await this.repo.findSurveyQuestionTypeById(companyId, data.questionTypeId);
    if (!qt || !qt.isActive) throw new NotFoundError(`Question type with ID ${data.questionTypeId} is not available.`);
    const maxOrder = await this.repo.findMaxSurveyTemplateQuestionOrder(companyId, templateId);
    return this.repo.createSurveyTemplateQuestion(companyId, templateId, { ...data, displayOrder: maxOrder + 1 });
  }

  async getSurveyTemplateQuestions(companyId: number, templateId: number) {
    await this.getSurveyTemplateById(companyId, templateId);
    return this.repo.findSurveyTemplateQuestions(companyId, templateId);
  }

  async getSurveyTemplateQuestionById(companyId: number, templateId: number, id: number) {
    await this.getSurveyTemplateById(companyId, templateId);
    const question = await this.repo.findSurveyTemplateQuestionById(companyId, templateId, id);
    if (!question) throw new NotFoundError(`Survey template question with ID ${id} not found.`);
    return question;
  }

  async updateSurveyTemplateQuestion(companyId: number, templateId: number, id: number, data: UpdateSurveyTemplateQuestionInput) {
    await this.getSurveyTemplateQuestionById(companyId, templateId, id);
    if (data.questionTypeId) {
      const qt = await this.repo.findSurveyQuestionTypeById(companyId, data.questionTypeId);
      if (!qt || !qt.isActive) throw new NotFoundError(`Question type with ID ${data.questionTypeId} is not available.`);
    }
    return this.repo.updateSurveyTemplateQuestion(companyId, templateId, id, data);
  }

  async deleteSurveyTemplateQuestion(companyId: number, templateId: number, id: number) {
    await this.getSurveyTemplateQuestionById(companyId, templateId, id);
    return this.repo.deleteSurveyTemplateQuestion(companyId, templateId, id);
  }

  async reorderSurveyTemplateQuestions(companyId: number, templateId: number, data: ReorderSurveyTemplateQuestionsInput) {
    await this.getSurveyTemplateById(companyId, templateId);
    const questions = await this.repo.findSurveyTemplateQuestions(companyId, templateId);
    const knownIds = new Set(questions.map((q) => q.id));
    const requestedIds = data.questions.map((q) => q.id);
    const missing = requestedIds.filter((qid) => !knownIds.has(qid));
    if (missing.length > 0) throw new NotFoundError(`Survey template question(s): ${missing.join(", ")}`);
    if (new Set(requestedIds).size !== requestedIds.length) throw new ConflictError("Duplicate question ids in reorder payload.");
    return this.repo.reorderSurveyTemplateQuestions(companyId, templateId, data.questions);
  }

  // ─── 5. Certificate Templates (+ signers) ──────────────────────────────────

  async createCertificateTemplate(companyId: number, userId: number, dto: CreateCertificateTemplateInput) {
    const certType = await this.repo.findCertificateTypeById(companyId, dto.certificateTypeId);
    if (!certType) throw new NotFoundError(`Certificate type with ID ${dto.certificateTypeId} does not exist.`);
    const existingName = await this.repo.findCertificateTemplateByName(companyId, dto.name);
    if (existingName) throw new ConflictError(`Certificate template with name '${dto.name}' already exists.`);
    return this.repo.createCertificateTemplate(companyId, userId, dto);
  }

  async getCertificateTemplateById(companyId: number, id: number) {
    const template = await this.repo.findCertificateTemplateById(companyId, id);
    if (!template) throw new NotFoundError(`Certificate template with ID ${id} not found.`);
    return template;
  }

  async listCertificateTemplates(companyId: number, query: CertificateTemplateFilterInput) {
    return this.repo.findCertificateTemplates(companyId, query);
  }

  async updateCertificateTemplate(companyId: number, id: number, userId: number, dto: UpdateCertificateTemplateInput) {
    await this.getCertificateTemplateById(companyId, id);
    if (dto.certificateTypeId) {
      const certType = await this.repo.findCertificateTypeById(companyId, dto.certificateTypeId);
      if (!certType) throw new NotFoundError(`Certificate type with ID ${dto.certificateTypeId} does not exist.`);
    }
    if (dto.name) {
      const existingName = await this.repo.findCertificateTemplateByName(companyId, dto.name);
      if (existingName && existingName.id !== id) throw new ConflictError(`Certificate template with name '${dto.name}' already exists.`);
    }
    return this.repo.updateCertificateTemplate(companyId, id, userId, dto);
  }

  async deleteCertificateTemplate(companyId: number, id: number) {
    await this.getCertificateTemplateById(companyId, id);
    const usageCount = await this.repo.countCertificateTemplateUsages(companyId, id);
    if (usageCount > 0) throw new ConflictError(`Cannot delete certificate template because ${usageCount} active certificate(s) have been issued with it.`);
    return this.repo.softDeleteCertificateTemplate(companyId, id);
  }

  async addCertificateTemplateSigner(companyId: number, templateId: number, dto: CreateCertificateTemplateSignerInput) {
    await this.getCertificateTemplateById(companyId, templateId);
    const existingEmployee = await this.repo.findCertificateTemplateSignerByEmployee(companyId, templateId, dto.employeeId);
    if (existingEmployee) throw new ConflictError(`Employee ID '${dto.employeeId}' is already assigned as a signer for this template.`);
    const existingOrder = await this.repo.findCertificateTemplateSignerByOrder(companyId, templateId, dto.displayOrder);
    if (existingOrder) throw new ConflictError(`Display order ${dto.displayOrder} is already occupied for this template.`);
    return this.repo.createCertificateTemplateSigner(companyId, templateId, dto);
  }

  async getCertificateTemplateSigners(companyId: number, templateId: number) {
    await this.getCertificateTemplateById(companyId, templateId);
    return this.repo.findCertificateTemplateSigners(companyId, templateId);
  }

  async updateCertificateTemplateSigner(companyId: number, templateId: number, signerId: number, dto: UpdateCertificateTemplateSignerInput) {
    await this.getCertificateTemplateById(companyId, templateId);
    const existing = await this.repo.findCertificateTemplateSignerById(companyId, signerId);
    if (!existing || existing.templateId !== templateId) throw new NotFoundError(`Signer with ID ${signerId} not found for this template.`);
    if (dto.employeeId && dto.employeeId !== existing.employeeId) {
      const dup = await this.repo.findCertificateTemplateSignerByEmployee(companyId, templateId, dto.employeeId);
      if (dup) throw new ConflictError(`Employee ID '${dto.employeeId}' is already assigned as a signer for this template.`);
    }
    if (dto.displayOrder !== undefined && dto.displayOrder !== existing.displayOrder) {
      const dup = await this.repo.findCertificateTemplateSignerByOrder(companyId, templateId, dto.displayOrder);
      if (dup) throw new ConflictError(`Display order ${dto.displayOrder} is already occupied for this template.`);
    }
    return this.repo.updateCertificateTemplateSigner(companyId, signerId, dto);
  }

  async deleteCertificateTemplateSigner(companyId: number, templateId: number, signerId: number) {
    await this.getCertificateTemplateById(companyId, templateId);
    const existing = await this.repo.findCertificateTemplateSignerById(companyId, signerId);
    if (!existing || existing.templateId !== templateId) throw new NotFoundError(`Signer with ID ${signerId} not found for this template.`);
    return this.repo.deleteCertificateTemplateSigner(companyId, signerId);
  }

  // ─── 6. Notification Templates ─────────────────────────────────────────────

  async createNotificationTemplate(companyId: number, userId: number, dto: CreateNotificationTemplateInput) {
    const event = await this.repo.findNotificationEventByCode(companyId, dto.eventCode);
    if (!event) throw new NotFoundError(`Notification event with code '${dto.eventCode}' not found`);
    const existingName = await this.repo.findNotificationTemplateByName(companyId, dto.name);
    if (existingName) throw new ConflictError(`Notification template with name '${dto.name}' already exists`);
    const payload = { ...dto, notificationEventId: dto.notificationEventId ?? event.id };
    return this.repo.createNotificationTemplate(companyId, userId, payload);
  }

  async getNotificationTemplateById(companyId: number, id: number) {
    const template = await this.repo.findNotificationTemplateById(companyId, id);
    if (!template) throw new NotFoundError(`Notification template with ID ${id} not found.`);
    return template;
  }

  async listNotificationTemplates(companyId: number, query: NotificationTemplateFilterInput) {
    return this.repo.findNotificationTemplates(companyId, query);
  }

  async updateNotificationTemplate(companyId: number, id: number, userId: number, dto: UpdateNotificationTemplateInput) {
    const template = await this.getNotificationTemplateById(companyId, id);
    if (dto.eventCode && dto.eventCode !== template.eventCode) {
      const event = await this.repo.findNotificationEventByCode(companyId, dto.eventCode);
      if (!event) throw new NotFoundError(`Notification event with code '${dto.eventCode}' not found`);
    }
    if (dto.name && dto.name !== template.name) {
      const existingName = await this.repo.findNotificationTemplateByName(companyId, dto.name);
      if (existingName && existingName.id !== id) throw new ConflictError(`Notification template with name '${dto.name}' already exists`);
    }
    return this.repo.updateNotificationTemplate(companyId, id, userId, dto);
  }

  async deleteNotificationTemplate(companyId: number, id: number) {
    await this.getNotificationTemplateById(companyId, id);
    const usages = await this.repo.countNotificationTemplateUsages(companyId, id);
    if (usages > 0) throw new ValidationError(`Cannot delete notification template. It is currently in use (${usages} usage(s))`);
    return this.repo.softDeleteNotificationTemplate(companyId, id);
  }
}
