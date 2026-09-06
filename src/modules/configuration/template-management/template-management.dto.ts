import { z } from "zod";
import { $Enums, ContentLifecycleStatus, ShowCorrectAnswersTiming } from "@prisma/client";

// =============================================================================
// Common schemas shared across every template entity
// =============================================================================

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(10),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === "true")),
});

const stringOrNumberToDecimal = z
  .union([z.number(), z.string()])
  .transform((val) => Number(val))
  .refine((val) => !isNaN(val), { message: "Must be a valid number" });

// =============================================================================
// 1. Course Template
// =============================================================================

export const createCourseTemplateSchema = z.object({
  name: z
    .string({ message: "Template name is required" })
    .trim()
    .min(3, "Template name must be at least 3 characters")
    .max(150, "Template name cannot exceed 150 characters"),
  description: z.string().trim().optional(),
  shortSummary: z.string().trim().max(300, "Short summary cannot exceed 300 characters").optional(),
  categoryId: z.number().int().positive({ message: "Category ID must be a valid integer" }),
  difficultyLevelId: z.number().int().positive({ message: "Difficulty Level ID must be a valid integer" }),
  ownerId: z.number().int().positive({ message: "Owner ID must be a valid integer" }),
  responsiblePersonId: z.number().int().positive({ message: "Responsible person ID must be a valid integer" }),
  language: z.string().max(20).optional().nullable(),
  thumbnailUrl: z.string().optional().nullable(),
  estimatedDurationMinutes: z.number().int().positive().optional().nullable(),
  visibility: z.nativeEnum($Enums.VisibilityType).optional().default($Enums.VisibilityType.COMPANY),
  enrollmentPolicy: z.nativeEnum($Enums.EnrollmentPolicy).optional().default($Enums.EnrollmentPolicy.OPEN),
  completionMethod: z.nativeEnum($Enums.CourseCompletionMethod).optional().default($Enums.CourseCompletionMethod.HYBRID),
  passingScore: z.number().min(0).max(100).default(0),
  completionThreshold: z.number().min(0).max(100).default(0),
  minTimeSpentMinutes: z.number().int().min(0).max(480).optional().nullable(),
  attendanceRequired: z.boolean().optional().default(false),
  minimumAttendance: z.number().min(0).max(100).optional().nullable(),
  certificateRequired: z.boolean().optional().default(true),
  baseXpOnCompletion: z.number().int().positive().optional().default(100),
  perfectScoreBonusXp: z.number().int().positive().optional().default(50),
  defaultChapters: z.array(z.record(z.string(), z.unknown())).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateCourseTemplateSchema = createCourseTemplateSchema
  .omit({ isActive: true, defaultChapters: true })
  .partial()
  .extend({
    isActive: z.boolean().optional(),
    defaultChapters: z.array(z.record(z.string(), z.unknown())).optional().nullable(),
  });

export const courseTemplateFilterQuerySchema = paginationQuerySchema.extend({
  categoryId: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
  difficultyLevelId: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
  ownerId: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
  completionMethod: z.nativeEnum($Enums.CourseCompletionMethod).optional(),
});

// =============================================================================
// 2. Program Template
// =============================================================================

export const createProgramTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional().nullable(),
  categoryId: z.number().int().positive().optional().nullable(),
  programTypeId: z.number().int().positive().optional().nullable(),
  durationWeeks: z.number().int().nonnegative().optional().nullable(),
  visibility: z.nativeEnum($Enums.VisibilityType).optional().default($Enums.VisibilityType.COMPANY),
  ownerEmployeeId: z.string().trim().min(1).max(20),
  isMandatory: z.boolean().optional().default(false),
  autoEnroll: z.boolean().optional().default(false),
  allowSelfEnrollment: z.boolean().optional().default(true),
  rollingEnrollment: z.boolean().optional().default(false),
  capacity: z.number().int().positive().optional().nullable(),
  certificateEnabled: z.boolean().optional().default(true),
  xpEnabled: z.boolean().optional().default(true),
  defaultMilestones: z.array(z.record(z.string(), z.unknown())).optional().nullable(),
  defaultCourses: z.array(z.record(z.string(), z.unknown())).optional().nullable(),
  defaultTasks: z.array(z.record(z.string(), z.unknown())).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateProgramTemplateSchema = createProgramTemplateSchema.partial();

export const programTemplateQuerySchema = paginationQuerySchema.extend({
  categoryId: z.coerce.number().int().positive().optional(),
  programTypeId: z.coerce.number().int().positive().optional(),
  ownerEmployeeId: z.string().optional(),
});

// =============================================================================
// 3. Assessment Template
// =============================================================================

export const createAssessmentTemplateSchema = z.object({
  name: z
    .string({ message: "Template name is required" })
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(255, "Name cannot exceed 255 characters"),
  description: z.string().trim().optional(),
  assessmentTypeId: z.number().int().positive({ message: "Assessment Type ID is required" }),
  gradingMethodId: z.number().int().positive({ message: "Grading Method ID is required" }),
  questionBankId: z.number().int().positive().optional().nullable(),
  passingScore: stringOrNumberToDecimal.pipe(z.number().min(0).max(100)),
  maxAttempts: z.number().int().positive().optional().default(2),
  timeLimitMinutes: z.number().int().positive().optional().nullable(),
  randomizeQuestions: z.boolean().optional().default(false),
  randomizeOptions: z.boolean().optional().default(false),
  showResultImmediately: z.boolean().optional().default(false),
  allowReview: z.boolean().optional().default(true),
  showCorrectAnswers: z.nativeEnum(ShowCorrectAnswersTiming, {
    message: "Show correct answers timing is required",
  }),
  lockdownBrowser: z.boolean().optional().default(false),
  proctoringEnabled: z.boolean().optional().default(false),
  tabSwitchDetection: z.boolean().optional().default(false),
  negativeMarking: stringOrNumberToDecimal.pipe(z.number().min(0).max(1)).optional().nullable(),
  questionCount: z.number().int().nonnegative().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const updateAssessmentTemplateSchema = createAssessmentTemplateSchema.partial();

export const assessmentTemplateFilterSchema = z.object({
  search: z.string().trim().optional(),
  assessmentTypeId: z.coerce.number().int().positive().optional(),
  gradingMethodId: z.coerce.number().int().positive().optional(),
  questionBankId: z.coerce.number().int().positive().optional(),
  isActive: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(10),
});

// =============================================================================
// 4. Survey Template  (+ dynamic question builder)
// =============================================================================

export const ConfigJsonSchema = z.record(z.string(), z.unknown()).nullish();

export const CreateSurveyTemplateQuestionSchema = z.object({
  questionTypeId: z.number().int().positive(),
  questionText: z.string().min(1).max(5000),
  isRequired: z.boolean().optional(),
  configJson: ConfigJsonSchema,
  displayOrder: z.number().int().positive().optional(),
});

export const UpdateSurveyTemplateQuestionSchema = CreateSurveyTemplateQuestionSchema.partial();

export const ReorderSurveyTemplateQuestionsSchema = z.object({
  questions: z
    .array(
      z.object({
        id: z.number().int().positive(),
        displayOrder: z.number().int().positive(),
      }),
    )
    .min(1),
});

export const TemplateQuestionInputSchema = CreateSurveyTemplateQuestionSchema.omit({
  displayOrder: true,
});

export const CreateSurveyTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  surveyType: z.nativeEnum($Enums.SurveyType),
  kirkpatrickLevel: z.nativeEnum($Enums.KirkpatrickLevel),
  isAnonymous: z.boolean().optional(),
  availableDays: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional(),
  questions: z.array(TemplateQuestionInputSchema).optional(),
});

export const UpdateSurveyTemplateSchema = CreateSurveyTemplateSchema.partial();

export const surveyTemplateQuerySchema = paginationQuerySchema.extend({
  surveyType: z.nativeEnum($Enums.SurveyType).optional(),
  kirkpatrickLevel: z.nativeEnum($Enums.KirkpatrickLevel).optional(),
});

// =============================================================================
// 5. Certificate Template  (+ signers)
// =============================================================================

export const CertificateTemplatePaginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  sortBy: z.string().optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  search: z.string().trim().optional(),
});

export const CreateCertificateTemplateSchema = z.object({
  name: z.string().trim().min(1).max(255),
  certificateTypeId: z.number().int().positive(),
  courseVersionId: z.number().int().positive().optional().nullable(),
  learningProgramId: z.number().int().positive().optional().nullable(),
  titleText: z.string().trim().max(255).optional().nullable(),
  credentialText: z.string().optional().nullable(),
  templateFile: z.string().trim().optional().nullable(),
  certificateIdPattern: z.string().trim().min(1).max(100),
  validityMonths: z.number().int().positive().optional().nullable(),
  sealImage: z.string().trim().optional().nullable(),
  qrVerificationEnabled: z.boolean().optional().default(true),
  backgroundImage: z.string().trim().optional().nullable(),
  status: z.nativeEnum(ContentLifecycleStatus).optional().default(ContentLifecycleStatus.DRAFT),
});

export const UpdateCertificateTemplateSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  certificateTypeId: z.number().int().positive().optional(),
  courseVersionId: z.number().int().positive().optional().nullable(),
  learningProgramId: z.number().int().positive().optional().nullable(),
  titleText: z.string().trim().max(255).optional().nullable(),
  credentialText: z.string().optional().nullable(),
  templateFile: z.string().trim().optional().nullable(),
  certificateIdPattern: z.string().trim().min(1).max(100).optional(),
  validityMonths: z.number().int().positive().optional().nullable(),
  sealImage: z.string().trim().optional().nullable(),
  qrVerificationEnabled: z.boolean().optional(),
  backgroundImage: z.string().trim().optional().nullable(),
  status: z.nativeEnum(ContentLifecycleStatus).optional(),
});

export const CertificateTemplateFilterSchema = CertificateTemplatePaginationSchema.extend({
  certificateTypeId: z.coerce.number().int().positive().optional(),
  courseVersionId: z.coerce.number().int().positive().optional(),
  learningProgramId: z.coerce.number().int().positive().optional(),
  status: z.nativeEnum(ContentLifecycleStatus).optional(),
});

export const CreateCertificateTemplateSignerSchema = z.object({
  employeeId: z.string().trim().min(1).max(20),
  displayOrder: z.number().int().min(1),
});

export const UpdateCertificateTemplateSignerSchema = z.object({
  employeeId: z.string().trim().min(1).max(20).optional(),
  displayOrder: z.number().int().min(1).optional(),
});

// =============================================================================
// 6. Notification Template
// =============================================================================

export const NotificationChannelEnum = z.nativeEnum($Enums.NotificationChannel);

export const createNotificationTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  channel: NotificationChannelEnum,
  eventCode: z.string().min(1).max(100),
  notificationEventId: z.number().int().positive().optional().nullable(),
  subject: z.string().max(255).optional().nullable(),
  body: z.string().min(1),
  variables: z.record(z.string(), z.unknown()).optional(),
  language: z.string().max(20).optional().default("en"),
  senderName: z.string().max(255).optional().nullable(),
  replyToEmail: z.string().max(255).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateNotificationTemplateSchema = createNotificationTemplateSchema.partial();

export const notificationTemplateFilterSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  search: z.string().optional(),
  channel: NotificationChannelEnum.optional(),
  eventCode: z.string().optional(),
  notificationEventId: z.coerce.number().int().positive().optional(),
  isActive: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  sortBy: z.enum(["name", "channel", "createdAt"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// =============================================================================
// Inferred input / query types
// =============================================================================

export type IdParam = z.infer<typeof idParamSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export type CreateCourseTemplateInput = z.infer<typeof createCourseTemplateSchema>;
export type UpdateCourseTemplateInput = z.infer<typeof updateCourseTemplateSchema>;
export type CourseTemplateFilterQuery = z.infer<typeof courseTemplateFilterQuerySchema>;

export type CreateProgramTemplateInput = z.infer<typeof createProgramTemplateSchema>;
export type UpdateProgramTemplateInput = z.infer<typeof updateProgramTemplateSchema>;
export type ProgramTemplateQueryInput = z.infer<typeof programTemplateQuerySchema>;

export type CreateAssessmentTemplateInput = z.infer<typeof createAssessmentTemplateSchema>;
export type UpdateAssessmentTemplateInput = z.infer<typeof updateAssessmentTemplateSchema>;
export type AssessmentTemplateFilterInput = z.infer<typeof assessmentTemplateFilterSchema>;

export type CreateSurveyTemplateInput = z.infer<typeof CreateSurveyTemplateSchema>;
export type UpdateSurveyTemplateInput = z.infer<typeof UpdateSurveyTemplateSchema>;
export type CreateSurveyTemplateQuestionInput = z.infer<typeof CreateSurveyTemplateQuestionSchema>;
export type UpdateSurveyTemplateQuestionInput = z.infer<typeof UpdateSurveyTemplateQuestionSchema>;
export type ReorderSurveyTemplateQuestionsInput = z.infer<typeof ReorderSurveyTemplateQuestionsSchema>;
export type ConfigJson = Record<string, unknown>;

export type CreateCertificateTemplateInput = z.infer<typeof CreateCertificateTemplateSchema>;
export type UpdateCertificateTemplateInput = z.infer<typeof UpdateCertificateTemplateSchema>;
export type CertificateTemplateFilterInput = z.infer<typeof CertificateTemplateFilterSchema>;
export type CreateCertificateTemplateSignerInput = z.infer<typeof CreateCertificateTemplateSignerSchema>;
export type UpdateCertificateTemplateSignerInput = z.infer<typeof UpdateCertificateTemplateSignerSchema>;

export type CreateNotificationTemplateInput = z.infer<typeof createNotificationTemplateSchema>;
export type UpdateNotificationTemplateInput = z.infer<typeof updateNotificationTemplateSchema>;
export type NotificationTemplateFilterInput = z.infer<typeof notificationTemplateFilterSchema>;