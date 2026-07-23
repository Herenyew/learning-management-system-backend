-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VisibilityType" AS ENUM ('PUBLIC', 'COMPANY', 'ENROLLED_ONLY', 'INVITATION_ONLY');

-- CreateEnum
CREATE TYPE "EnrollmentPolicy" AS ENUM ('OPEN', 'INVITATION_ONLY', 'PAYMENT_REQUIRED');

-- CreateEnum
CREATE TYPE "WorkflowInstanceStatus" AS ENUM ('DRAFT', 'PENDING', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('NOT_STARTED', 'ACHIEVED', 'OVERDUE', 'WAIVED');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "EnrollmentSource" AS ENUM ('SELF_SERVICE', 'ADMIN_ASSIGNED', 'MANAGER_ASSIGNED', 'HRIS_SYNC', 'API', 'CSV_IMPORT', 'INVITE_CODE');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('PENDING', 'WAITLISTED', 'ACTIVE', 'COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "EnrollmentType" AS ENUM ('STANDARD', 'AUDIT', 'TRIAL', 'COMPLIANCE', 'GUEST', 'WAITLIST', 'SPONSORED');

-- CreateEnum
CREATE TYPE "EnrollmentEntityType" AS ENUM ('COURSE', 'PROGRAM');

-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('WAITING', 'OFFERED', 'ACCEPTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ChapterStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AudienceType" AS ENUM ('ALL_USERS', 'DEPARTMENT', 'JOB_TITLE', 'JOB_LEVEL', 'APP_ROLE', 'EMPLOYMENT_TYPE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'PARTIAL', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('COURSE_CONTENT', 'ASSESSMENT', 'LIVE_SESSION', 'ASSIGNMENT', 'SURVEY', 'MANAGER_CHECKIN', 'PEER_REVIEW', 'EXTERNAL_ACTIVITY', 'READING', 'OTHER');

-- CreateEnum
CREATE TYPE "TaskSubmissionType" AS ENUM ('FILE_UPLOAD', 'TEXT_INPUT', 'LINK', 'QUIZ', 'NONE');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "LearningProgramStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AttendanceMethod" AS ENUM ('QR_CODE', 'MANUAL', 'SYSTEM_AUTO', 'BIOMETRIC');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('PRE_ASSESSMENT', 'POST_ASSESSMENT', 'CHAPTER_QUIZ', 'COURSE_FINAL', 'PRACTICE');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY', 'MATCHING', 'ORDERING', 'FILL_BLANK', 'MULTI_SELECT', 'DRAG_DROP');

-- CreateEnum
CREATE TYPE "GradingMethod" AS ENUM ('HIGHEST_SCORE', 'LATEST_ATTEMPT', 'AVERAGE_SCORE', 'FIRST_ATTEMPT');

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "QuestionVersionApprovalStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'GRADED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CertificateType" AS ENUM ('COURSE_COMPLETION', 'PROGRAM_COMPLETION', 'CERTIFICATION', 'BADGE', 'ATTENDANCE', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "TemplateStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VerificationMethod" AS ENUM ('QR_CODE', 'VERIFICATION_CODE', 'API', 'MANUAL', 'PUBLIC_LINK');

-- CreateEnum
CREATE TYPE "ExternalCredentialStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "CredentialSource" AS ENUM ('MANUAL_UPLOAD', 'API_INTEGRATION', 'EMAIL_SUBMISSION', 'LINKEDIN', 'OTHER');

-- CreateEnum
CREATE TYPE "ProviderType" AS ENUM ('CERTIFICATION_BODY', 'UNIVERSITY', 'ONLINE_PLATFORM', 'GOVERNMENT', 'INTERNAL', 'OTHER');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('VIRTUAL', 'PHYSICAL', 'HYBRID');

-- CreateEnum
CREATE TYPE "LiveSessionStatus" AS ENUM ('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MeetingProvider" AS ENUM ('ZOOM', 'MICROSOFT_TEAMS', 'GOOGLE_MEET', 'WEBEX', 'INPERSON', 'OTHER');

-- CreateEnum
CREATE TYPE "SurveyQuestionType" AS ENUM ('RATING', 'MULTIPLE_CHOICE', 'MULTI_SELECT', 'TEXT', 'YES_NO', 'SCALE');

-- CreateEnum
CREATE TYPE "SurveyType" AS ENUM ('PRE_COURSE', 'POST_COURSE', 'MANAGER_FOLLOWUP');

-- CreateEnum
CREATE TYPE "SurveyStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "KirkpatrickLevel" AS ENUM ('L1_REACTION', 'L2_LEARNING', 'L3_BEHAVIOR', 'L4_RESULTS');

-- CreateEnum
CREATE TYPE "TrainingRequestType" AS ENUM ('INTERNAL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "PriorityLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "FundingType" AS ENUM ('COMPANY_FUNDED', 'SELF_FUNDED', 'SHARED');

-- CreateEnum
CREATE TYPE "TnaStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RecommendationSource" AS ENUM ('AI', 'MANUAL', 'MANAGER', 'HR');

-- CreateEnum
CREATE TYPE "XpRuleCategory" AS ENUM ('ENROLLMENT', 'COMPLETION', 'ASSESSMENT', 'ENGAGEMENT', 'MANUAL');

-- CreateEnum
CREATE TYPE "XpTriggerEvent" AS ENUM ('COURSE_COMPLETED', 'ASSESSMENT_PASSED', 'PERFECT_SCORE', 'PROGRAM_COMPLETED', 'CERTIFICATE_EARNED', 'BADGE_AWARDED', 'MANUAL_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "XpSourceType" AS ENUM ('COURSE_COMPLETION', 'ASSESSMENT_ATTEMPT', 'PROGRAM_COMPLETION', 'CERTIFICATE', 'BADGE', 'MANUAL');

-- CreateEnum
CREATE TYPE "BadgeCategory" AS ENUM ('ACHIEVEMENT', 'MILESTONE', 'STREAK', 'SKILL', 'PARTICIPATION');

-- CreateEnum
CREATE TYPE "TrainingFormat" AS ENUM ('ONLINE', 'INSTRUCTOR_LED', 'BLENDED', 'EXTERNAL', 'CONFERENCE', 'ON_THE_JOB');

-- CreateEnum
CREATE TYPE "SettingCategory" AS ENUM ('GENERAL', 'ENROLLMENT', 'NOTIFICATIONS', 'CERTIFICATION', 'GAMIFICATION', 'SECURITY', 'INTEGRATIONS');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationModule" AS ENUM ('COURSE', 'PROGRAM', 'ENROLLMENT', 'ASSESSMENT', 'CERTIFICATION', 'LIVE_SESSION', 'SURVEY', 'TNA', 'GAMIFICATION', 'SYSTEM');

-- CreateEnum
CREATE TYPE "EnrollmentTargetType" AS ENUM ('COURSE', 'PROGRAM', 'LEARNING_PATH');

-- CreateEnum
CREATE TYPE "EnrollmentRuleType" AS ENUM ('AUTO_ENROLL', 'RESTRICT_ACCESS', 'REQUIRE_APPROVAL', 'WAITLIST_PRIORITY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SettingDataType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON');

-- CreateEnum
CREATE TYPE "ApprovalRole" AS ENUM ('MANAGER', 'HR', 'FINANCE', 'ADMIN', 'CEO', 'CUSTOM');

-- CreateEnum
CREATE TYPE "WorkflowEntityType" AS ENUM ('COURSE', 'COURSE_VERSION', 'LEARNING_PROGRAM', 'TNA_REQUEST', 'CERTIFICATE', 'LIVE_SESSION', 'OTHER');

-- CreateTable
CREATE TABLE "company" (
    "id" INTEGER NOT NULL,
    "company_code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "logo_url" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_synced_at" TIMESTAMP(3),

    CONSTRAINT "company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee" (
    "id" VARCHAR(20) NOT NULL,
    "company_id" INTEGER NOT NULL,
    "full_name" VARCHAR(150) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_synced_at" TIMESTAMP(3),
    "department_id" INTEGER,
    "job_title_id" INTEGER,

    CONSTRAINT "employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_user" (
    "id" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "employeeId" VARCHAR(20),
    "email" VARCHAR(150) NOT NULL,
    "roleId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_titles" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),

    CONSTRAINT "job_titles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_level" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),

    CONSTRAINT "job_level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_permissions" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "module" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lms_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_role_permissions" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "appRoleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lms_role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_role" (
    "id" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),

    CONSTRAINT "app_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "code" VARCHAR(50),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "thumbnailUrl" TEXT,
    "shortSummary" VARCHAR(150),
    "categoryId" INTEGER NOT NULL,
    "language" VARCHAR(20),
    "learningObjectives" TEXT[],
    "estimatedHours" DECIMAL(65,30),
    "keywords" TEXT[],
    "contactEmployeeId" VARCHAR(20),
    "ownerEmployeeId" VARCHAR(20),
    "visibility" "VisibilityType" NOT NULL DEFAULT 'COMPANY',
    "enrollmentPolicy" "EnrollmentPolicy" NOT NULL DEFAULT 'OPEN',
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "sourceTemplateId" INTEGER,
    "createdBy" INTEGER NOT NULL,
    "updatedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_versions" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,
    "majorVersion" INTEGER NOT NULL DEFAULT 1,
    "minorVersion" INTEGER NOT NULL DEFAULT 0,
    "versionLabel" VARCHAR(50),
    "changeLog" TEXT,
    "status" "VersionStatus" NOT NULL DEFAULT 'DRAFT',
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "difficultyLevel" "DifficultyLevel" NOT NULL,
    "estimatedDurationMinutes" INTEGER,
    "passingScore" DECIMAL(5,2) NOT NULL,
    "completionThreshold" DECIMAL(5,2) NOT NULL,
    "certificateRequired" BOOLEAN NOT NULL DEFAULT true,
    "attendanceRequired" BOOLEAN NOT NULL DEFAULT false,
    "minimumAttendance" DECIMAL(5,2),
    "allowDownload" BOOLEAN NOT NULL,
    "capacity" INTEGER,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "previewAvailable" BOOLEAN NOT NULL,
    "publishDate" TIMESTAMP(3),
    "publishedBy" INTEGER,
    "approvedBy" INTEGER,
    "approvedAt" TIMESTAMP(3),
    "createdBy" INTEGER NOT NULL,
    "updatedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "course_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_tags" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "color" VARCHAR(20),
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "course_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_tag_mappings" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_tag_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_announcements" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "courseVersionId" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "publishAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "sendNotification" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" INTEGER NOT NULL,
    "updatedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "course_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_categories" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "slug" VARCHAR(120) NOT NULL,
    "color" VARCHAR(20),
    "icon" VARCHAR(50),
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "parentId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "course_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructor_roles" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "instructor_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_instructors" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "courseVersionId" INTEGER NOT NULL,
    "employeeId" VARCHAR(20),
    "appUserId" INTEGER,
    "roleId" INTEGER NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "course_instructors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_skills" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,
    "skillId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "course_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_skill_assessments" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "employeeId" VARCHAR(20) NOT NULL,
    "skillId" INTEGER NOT NULL,
    "completionId" INTEGER NOT NULL,
    "preScore" DECIMAL(5,2),
    "postScore" DECIMAL(5,2) NOT NULL,
    "improvementPercentage" DECIMAL(5,2) NOT NULL,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assessedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "employee_skill_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_prerequisites" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,
    "prerequisiteCourseId" INTEGER NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "course_prerequisites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_chapters" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "courseVersionId" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL,
    "status" "ChapterStatus" NOT NULL DEFAULT 'DRAFT',
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "course_chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapter_prerequisites" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "chapterId" INTEGER NOT NULL,
    "prerequisiteChapterId" INTEGER NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chapter_prerequisites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_contents" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "chapterId" INTEGER NOT NULL,
    "contentTypeId" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL,
    "durationMinutes" INTEGER,
    "externalUrl" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "allowDownload" BOOLEAN NOT NULL DEFAULT false,
    "transcriptUrl" TEXT,
    "pageCount" INTEGER,
    "completionThreshold" DECIMAL(5,2),
    "minimumTimeMinutes" INTEGER,
    "scormLaunchUrl" TEXT,
    "scormTrackingMode" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "course_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_files" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "contentId" INTEGER NOT NULL,
    "fileTypeId" INTEGER NOT NULL,
    "originalFileName" VARCHAR(255) NOT NULL,
    "storedFileName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "fileExtension" VARCHAR(20),
    "fileSizeBytes" BIGINT NOT NULL,
    "checksum" TEXT,
    "s3Bucket" VARCHAR(255) NOT NULL,
    "s3Key" VARCHAR(1000) NOT NULL,
    "s3Region" VARCHAR(100),
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "uploadedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "content_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentType" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ContentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentFileType" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ContentFileType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "employeeId" VARCHAR(20) NOT NULL,
    "courseId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_reviews" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "completionId" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "reviewTitle" VARCHAR(255),
    "reviewText" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "moderatedBy" INTEGER,
    "moderatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "course_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "related_courses" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,
    "relatedCourseId" INTEGER NOT NULL,
    "relationType" VARCHAR(50) NOT NULL,
    "reason" TEXT,
    "weight" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "related_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_faqs" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,
    "courseVersionId" INTEGER,
    "question" VARCHAR(500) NOT NULL,
    "answer" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" INTEGER NOT NULL,
    "updatedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "course_faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "target_audiences" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "entityType" VARCHAR(20) NOT NULL,
    "entityId" INTEGER NOT NULL,
    "audienceType" "AudienceType" NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "jobTitleId" INTEGER,
    "jobLevelId" INTEGER,
    "appRoleId" INTEGER,
    "employmentType" VARCHAR(50),
    "customValue" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "courseId" INTEGER,
    "learningProgramId" INTEGER,
    "assessmentId" INTEGER,
    "certificateTemplateId" INTEGER,
    "liveSessionId" INTEGER,
    "courseTemplateId" INTEGER,
    "programTemplateId" INTEGER,
    "assessmentTemplateId" INTEGER,

    CONSTRAINT "target_audiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_programs" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "programTypeId" INTEGER NOT NULL,
    "ownerEmployeeId" VARCHAR(20) NOT NULL,
    "visibility" "VisibilityType" NOT NULL,
    "status" "LearningProgramStatus" NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "durationDays" INTEGER,
    "rollingEnrollment" BOOLEAN NOT NULL DEFAULT false,
    "maxEnrollments" INTEGER,
    "approvalStatus" "ApprovalStatus" NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "updatedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "programCategoryId" INTEGER,

    CONSTRAINT "learning_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_types" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_categories" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "color" VARCHAR(20),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" INTEGER NOT NULL,
    "updatedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "program_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_courses" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "programId" INTEGER NOT NULL,
    "courseVersionId" INTEGER NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "program_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_cohorts" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "programId" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "capacity" INTEGER,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),

    CONSTRAINT "program_cohorts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_enrollments" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "employeeId" VARCHAR(20) NOT NULL,
    "programId" INTEGER NOT NULL,
    "cohortId" INTEGER,
    "enrollmentStatus" "EnrollmentStatus" NOT NULL,
    "progressPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "assignedBy" INTEGER,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "program_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_milestones" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "programId" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "milestonePercentage" DECIMAL(5,2) NOT NULL,
    "targetDate" TIMESTAMP(3),
    "targetOffsetDays" INTEGER,
    "completionExpression" JSONB,
    "overdueAction" TEXT,
    "reminderOffsetsDays" INTEGER[],

    CONSTRAINT "program_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_milestone_progresses" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "milestoneId" INTEGER NOT NULL,
    "programEnrollmentId" INTEGER NOT NULL,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "achievedAt" TIMESTAMP(3),
    "overdueAt" TIMESTAMP(3),
    "remarks" TEXT,

    CONSTRAINT "program_milestone_progresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_tasks" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "programId" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "taskType" "TaskType" NOT NULL,
    "courseVersionId" INTEGER,
    "courseContentId" INTEGER,
    "assessmentId" INTEGER,
    "liveSessionId" INTEGER,
    "surveyId" INTEGER,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isBlocking" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL,
    "phaseNumber" INTEGER,
    "dueDate" TIMESTAMP(3),
    "dueOffsetDays" INTEGER,
    "minimumTimeMinutes" INTEGER,
    "minimumScore" DECIMAL(5,2),
    "minimumAttendance" DECIMAL(5,2),
    "requiresManagerApproval" BOOLEAN NOT NULL DEFAULT false,
    "peerReviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "xpAward" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "program_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_task_submissions" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "taskId" INTEGER NOT NULL,
    "employeeId" VARCHAR(20) NOT NULL,
    "status" "TaskStatus" NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" INTEGER,
    "score" DECIMAL(5,2),
    "remarks" TEXT,
    "submissionText" TEXT,
    "submissionUrl" TEXT,
    "fileUrl" TEXT,
    "completedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "program_task_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "employeeId" VARCHAR(20) NOT NULL,
    "courseVersionId" INTEGER NOT NULL,
    "programEnrollmentId" INTEGER,
    "enrollmentNo" INTEGER NOT NULL DEFAULT 1,
    "enrollmentType" "EnrollmentType" NOT NULL,
    "enrollmentSource" "EnrollmentSource" NOT NULL,
    "status" "EnrollmentStatus" NOT NULL,
    "approvalStatus" "ApprovalStatus",
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "assignedBy" INTEGER,
    "approvedBy" INTEGER,
    "cancelledReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollment_rules" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "entityType" "EnrollmentEntityType" NOT NULL,
    "courseVersionId" INTEGER,
    "programId" INTEGER,
    "ruleType" "EnrollmentRuleType" NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "targetAudienceId" INTEGER,
    "conditionExpression" JSONB,
    "createdBy" INTEGER NOT NULL,
    "updatedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "enrollment_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_progress" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "enrollmentId" INTEGER NOT NULL,
    "overallProgress" DECIMAL(5,2) NOT NULL,
    "completedLessons" INTEGER NOT NULL,
    "totalLessons" INTEGER NOT NULL,
    "completedAssessments" INTEGER NOT NULL,
    "totalAssessments" INTEGER NOT NULL,
    "totalLearningMinutes" INTEGER NOT NULL,
    "lastAccessedAt" TIMESTAMP(3),
    "lastContentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_progress" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "learningProgressId" INTEGER NOT NULL,
    "contentId" INTEGER NOT NULL,
    "status" "ProgressStatus" NOT NULL,
    "watchPercentage" DECIMAL(5,2),
    "lastPositionSeconds" INTEGER DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "timeSpentMinutes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_sessions" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "enrollmentId" INTEGER NOT NULL,
    "sessionStart" TIMESTAMP(3) NOT NULL,
    "sessionEnd" TIMESTAMP(3),
    "totalSeconds" INTEGER NOT NULL DEFAULT 0,
    "deviceType" VARCHAR(30),
    "ipAddress" VARCHAR(45),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollment_activity_logs" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "enrollmentId" INTEGER NOT NULL,
    "activityType" VARCHAR(50) NOT NULL,
    "previousStatus" "EnrollmentStatus",
    "currentStatus" "EnrollmentStatus",
    "performedBy" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enrollment_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waitlist_entries" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "enrollmentId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "status" "WaitlistStatus" NOT NULL,
    "offeredAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waitlist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_completions" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "enrollmentId" INTEGER NOT NULL,
    "finalScore" DECIMAL(5,2) NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "completionSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_completions" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "programEnrollmentId" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "completionSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "courseVersionId" INTEGER NOT NULL,
    "contentId" INTEGER,
    "templateId" INTEGER,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "assessmentType" "AssessmentType" NOT NULL,
    "gradingMethod" "GradingMethod" NOT NULL,
    "passScore" DECIMAL(5,2) NOT NULL,
    "maxAttempts" INTEGER NOT NULL,
    "durationMinutes" INTEGER,
    "negativeMarking" DECIMAL(8,2),
    "showCorrectAnswersAfterAllSubmit" BOOLEAN NOT NULL DEFAULT false,
    "allowQuestionReview" BOOLEAN NOT NULL DEFAULT true,
    "autoSubmitOnTimeLimit" BOOLEAN NOT NULL DEFAULT false,
    "tabSwitchLimit" INTEGER,
    "lockdownBrowser" BOOLEAN NOT NULL DEFAULT false,
    "proctoringEnabled" BOOLEAN NOT NULL DEFAULT false,
    "randomizeQuestions" BOOLEAN NOT NULL DEFAULT false,
    "randomizeOptions" BOOLEAN NOT NULL DEFAULT false,
    "showResultImmediately" BOOLEAN NOT NULL DEFAULT false,
    "status" "AssessmentStatus" NOT NULL,
    "pairedAssessmentId" INTEGER,
    "createdBy" INTEGER NOT NULL,
    "updatedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_blueprints" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "assessmentId" INTEGER NOT NULL,
    "topicId" INTEGER,
    "difficulty" "DifficultyLevel",
    "questionType" "QuestionType",
    "questionCount" INTEGER NOT NULL,

    CONSTRAINT "assessment_blueprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_questions" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "assessmentId" INTEGER NOT NULL,
    "questionVersionId" INTEGER NOT NULL,
    "marks" DECIMAL(8,2) NOT NULL,
    "displayOrder" INTEGER,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "questionId" INTEGER,

    CONSTRAINT "assessment_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "currentVersionId" INTEGER,
    "topicId" INTEGER,
    "difficulty" "DifficultyLevel" NOT NULL,
    "questionType" "QuestionType" NOT NULL,
    "status" "QuestionStatus" NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_versions" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "versionNo" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "explanation" TEXT,
    "defaultScore" DECIMAL(8,2) NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "questionVersionId" INTEGER NOT NULL,
    "optionLabel" TEXT,
    "optionText" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_attempts" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "enrollmentId" INTEGER NOT NULL,
    "assessmentId" INTEGER NOT NULL,
    "attemptNo" INTEGER NOT NULL,
    "status" "AttemptStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "gradedAt" TIMESTAMP(3),
    "gradedBy" INTEGER,
    "score" DECIMAL(8,2),
    "passed" BOOLEAN,
    "snapshot" JSONB,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "assessment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_answers" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "attemptId" INTEGER NOT NULL,
    "questionVersionId" INTEGER NOT NULL,
    "earnedMarks" DECIMAL(8,2),
    "isCorrect" BOOLEAN,
    "answerSnapshot" JSONB,
    "approvalStatus" "QuestionVersionApprovalStatus" NOT NULL,
    "approvedBy" INTEGER,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "assessment_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_templates" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "courseVersionId" INTEGER,
    "learningProgramId" INTEGER,
    "name" VARCHAR(255) NOT NULL,
    "certificateType" "CertificateType" NOT NULL,
    "templateFile" TEXT,
    "certificateIdPattern" VARCHAR(100) NOT NULL,
    "validityMonths" INTEGER,
    "sealImage" TEXT,
    "qrVerificationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "backgroundImage" TEXT,
    "status" "TemplateStatus" NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "updatedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "certificate_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_template_signers" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "templateId" INTEGER NOT NULL,
    "employeeId" VARCHAR(20) NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificate_template_signers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "completionId" INTEGER,
    "programCompletionId" INTEGER,
    "templateId" INTEGER NOT NULL,
    "certificateNumber" VARCHAR(100) NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "verificationCode" VARCHAR(100) NOT NULL,
    "verificationQrUrl" TEXT,
    "status" "CertificateStatus" NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_verifications" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "certificateId" INTEGER NOT NULL,
    "verificationMethod" "VerificationMethod" NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" VARCHAR(50),
    "userAgent" TEXT,
    "verifiedByEmployeeId" VARCHAR(20),

    CONSTRAINT "certificate_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_certificates" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "employeeId" VARCHAR(20) NOT NULL,
    "providerId" INTEGER NOT NULL,
    "certificateName" VARCHAR(255) NOT NULL,
    "credentialNumber" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "verificationStatus" "ExternalCredentialStatus" NOT NULL,
    "source" "CredentialSource" NOT NULL,
    "uploadedFile" TEXT,
    "apiReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "external_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_providers" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "providerType" "ProviderType" NOT NULL,
    "apiEndpoint" TEXT,
    "apiKeyReference" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_sessions" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "courseVersionId" INTEGER NOT NULL,
    "learningProgramId" INTEGER,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "sessionType" "SessionType" NOT NULL,
    "status" "LiveSessionStatus" NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "timezone" VARCHAR(100) NOT NULL,
    "venue" VARCHAR(255),
    "meetingUrl" TEXT,
    "meetingProvider" "MeetingProvider",
    "capacity" INTEGER NOT NULL,
    "waitlistCapacity" INTEGER,
    "recordingUrl" TEXT,
    "attendanceRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" INTEGER NOT NULL,
    "updatedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "live_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_session_instructors" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "employeeId" VARCHAR(20) NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_session_instructors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_session_attendance" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "enrollmentId" INTEGER NOT NULL,
    "attendanceStatus" "AttendanceStatus" NOT NULL,
    "checkInTime" TIMESTAMP(3),
    "checkOutTime" TIMESTAMP(3),
    "attendancePercentage" DECIMAL(5,2),
    "attendanceMethod" "AttendanceMethod",
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "live_session_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_session_waitlists" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "enrollmentId" INTEGER NOT NULL,
    "queuePosition" INTEGER NOT NULL,
    "status" "WaitlistStatus" NOT NULL,
    "offeredAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_session_waitlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surveys" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "courseVersionId" INTEGER,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "surveyType" "SurveyType" NOT NULL,
    "kirkpatrickLevel" "KirkpatrickLevel" NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" "SurveyStatus" NOT NULL,
    "availableFrom" TIMESTAMP(3),
    "availableUntil" TIMESTAMP(3),
    "createdBy" INTEGER NOT NULL,
    "updatedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_questions" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "surveyId" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionType" "SurveyQuestionType" NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survey_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_responses" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "surveyId" INTEGER NOT NULL,
    "completionId" INTEGER NOT NULL,
    "employeeId" VARCHAR(20),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_answers" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "responseId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "ratingValue" INTEGER,
    "selectedOption" TEXT,
    "textAnswer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "effectiveness_weight_configs" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "reactionWeight" DECIMAL(5,2) NOT NULL,
    "learningWeight" DECIMAL(5,2) NOT NULL,
    "behaviorWeight" DECIMAL(5,2) NOT NULL,
    "resultsWeight" DECIMAL(5,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "effectiveness_weight_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_effectiveness" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "completionId" INTEGER NOT NULL,
    "reactionScore" DECIMAL(5,2),
    "reactionEvaluatedAt" TIMESTAMP(3),
    "learningScore" DECIMAL(5,2),
    "learningEvaluatedAt" TIMESTAMP(3),
    "behaviorScore" DECIMAL(5,2),
    "behaviorEvaluatedAt" TIMESTAMP(3),
    "behaviorDueAt" TIMESTAMP(3),
    "resultsScore" DECIMAL(5,2),
    "resultsEvaluatedAt" TIMESTAMP(3),
    "resultsDueAt" TIMESTAMP(3),
    "overallScore" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_effectiveness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tna_request_type_configs" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tna_request_type_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tna_approval_workflow_steps" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "approverJobTitleId" INTEGER,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tna_approval_workflow_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_need_requests" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "employeeId" VARCHAR(20) NOT NULL,
    "requestTypeId" INTEGER NOT NULL,
    "fundingType" "FundingType" NOT NULL,
    "status" "TnaStatus" NOT NULL,
    "priority" "PriorityLevel" NOT NULL,
    "targetAudienceId" INTEGER,
    "departmentId" INTEGER,
    "jobTitleId" INTEGER,
    "jobLevelId" INTEGER,
    "employmentType" VARCHAR(50),
    "trainingTitle" VARCHAR(255) NOT NULL,
    "providerName" VARCHAR(255),
    "objective" TEXT,
    "competencyGap" TEXT NOT NULL,
    "businessJustification" TEXT NOT NULL,
    "expectedOutcome" TEXT,
    "preferredFormat" "TrainingFormat",
    "preferredStartDate" TIMESTAMP(3),
    "targetCompletionDate" TIMESTAMP(3),
    "estimatedCost" DECIMAL(12,2),
    "attachmentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "training_need_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_need_skills" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "requestId" INTEGER NOT NULL,
    "skillId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_need_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tna_approvals" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "requestId" INTEGER NOT NULL,
    "workflowStepId" INTEGER NOT NULL,
    "approverId" VARCHAR(20) NOT NULL,
    "status" "ApprovalStatus" NOT NULL,
    "comments" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tna_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tna_recommendations" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "requestId" INTEGER,
    "courseVersionId" INTEGER,
    "learningProgramId" INTEGER,
    "recommendationSource" "RecommendationSource" NOT NULL,
    "confidenceScore" DECIMAL(5,2),
    "recommendationReason" TEXT,
    "targetAudienceId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tna_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tna_recommendation_skills" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "recommendationId" INTEGER NOT NULL,
    "skillId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tna_recommendation_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xp_rules" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "category" "XpRuleCategory" NOT NULL,
    "triggerEvent" "XpTriggerEvent" NOT NULL,
    "xpAmount" INTEGER NOT NULL,
    "maximumAward" INTEGER,
    "multiplier" DECIMAL(5,2),
    "targetAudienceId" INTEGER,
    "conditionExpression" JSONB,
    "courseVersionId" INTEGER,
    "programId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" INTEGER NOT NULL,
    "updatedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "xp_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xp_transactions" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "employeeId" VARCHAR(20) NOT NULL,
    "ruleId" INTEGER,
    "sourceType" "XpSourceType" NOT NULL,
    "sourceId" INTEGER,
    "xpAwarded" INTEGER NOT NULL,
    "multiplier" DECIMAL(5,2),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "xp_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_levels" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "minimumXp" INTEGER NOT NULL,
    "maximumXp" INTEGER,
    "badgeColor" TEXT,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "iconUrl" TEXT,
    "badgeCategory" "BadgeCategory" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badge_rules" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "badgeId" INTEGER NOT NULL,
    "triggerEvent" "XpTriggerEvent",
    "minimumXp" INTEGER,
    "minimumCourses" INTEGER,
    "minimumCertificates" INTEGER,
    "minimumPrograms" INTEGER,
    "targetAudienceId" INTEGER,
    "customExpression" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "badge_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_badges" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "badgeId" INTEGER NOT NULL,
    "employeeId" VARCHAR(20) NOT NULL,
    "awardedBy" INTEGER,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" INTEGER,
    "revokedReason" TEXT,

    CONSTRAINT "employee_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "category" "SettingCategory" NOT NULL,
    "settingKey" VARCHAR(150) NOT NULL,
    "settingValue" JSONB NOT NULL,
    "description" TEXT,
    "updatedBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_templates" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "categoryId" INTEGER NOT NULL,
    "difficultyLevel" "DifficultyLevel" NOT NULL,
    "visibility" "VisibilityType" NOT NULL,
    "estimatedDurationMinutes" INTEGER NOT NULL,
    "passingScore" DECIMAL(5,2) NOT NULL,
    "completionThreshold" DECIMAL(5,2) NOT NULL,
    "attendanceRequired" BOOLEAN NOT NULL DEFAULT false,
    "minimumAttendance" DECIMAL(5,2),
    "certificateRequired" BOOLEAN NOT NULL DEFAULT true,
    "language" VARCHAR(20),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" INTEGER NOT NULL,
    "updatedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "course_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_templates" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "categoryId" INTEGER,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "durationWeeks" INTEGER,
    "visibility" "VisibilityType" NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "autoEnroll" BOOLEAN NOT NULL DEFAULT false,
    "certificateEnabled" BOOLEAN NOT NULL DEFAULT true,
    "xpEnabled" BOOLEAN NOT NULL DEFAULT true,
    "allowSelfEnrollment" BOOLEAN NOT NULL DEFAULT true,
    "rollingEnrollment" BOOLEAN NOT NULL DEFAULT false,
    "capacity" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" INTEGER NOT NULL,
    "updatedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "program_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_templates" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "assessmentType" "AssessmentType" NOT NULL,
    "passingScore" DECIMAL(5,2) NOT NULL,
    "maxAttempts" INTEGER NOT NULL DEFAULT 2,
    "timeLimitMinutes" INTEGER,
    "randomizeQuestions" BOOLEAN NOT NULL DEFAULT false,
    "randomizeOptions" BOOLEAN NOT NULL DEFAULT false,
    "showResultImmediately" BOOLEAN NOT NULL DEFAULT false,
    "allowReview" BOOLEAN NOT NULL DEFAULT true,
    "lockdownBrowser" BOOLEAN NOT NULL DEFAULT false,
    "proctoringEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" INTEGER NOT NULL,
    "updatedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "assessment_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_templates" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "surveyType" "SurveyType" NOT NULL,
    "kirkpatrickLevel" "KirkpatrickLevel" NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "availableDays" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" INTEGER NOT NULL,
    "updatedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "survey_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "eventCode" VARCHAR(100) NOT NULL,
    "subject" VARCHAR(255),
    "body" TEXT NOT NULL,
    "variables" JSONB,
    "language" VARCHAR(20),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" INTEGER NOT NULL,
    "updatedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "notificationEventId" INTEGER,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationEvent" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "module" "NotificationModule" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_path_templates" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "estimatedDurationDays" INTEGER,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" INTEGER NOT NULL,
    "updatedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "learning_path_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_workflows" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "entityType" "WorkflowEntityType" NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" INTEGER NOT NULL,
    "updatedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "approval_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_workflow_steps" (
    "id" SERIAL NOT NULL,
    "workflowId" INTEGER NOT NULL,
    "approvalOrder" INTEGER NOT NULL,
    "approverRole" VARCHAR(100),
    "approverEmployeeId" VARCHAR(20),
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "autoApprove" BOOLEAN NOT NULL DEFAULT false,
    "timeoutDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_workflow_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_workflow_instances" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "workflowId" INTEGER NOT NULL,
    "entityType" "WorkflowEntityType" NOT NULL,
    "courseVersionId" INTEGER,
    "learningProgramId" INTEGER,
    "status" "WorkflowInstanceStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedBy" INTEGER,
    "submittedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "latestComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_workflow_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_decisions" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "instanceId" INTEGER NOT NULL,
    "workflowStepId" INTEGER NOT NULL,
    "status" "ApprovalStatus" NOT NULL,
    "comment" TEXT,
    "decidedBy" INTEGER,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_company_code_key" ON "company"("company_code");

-- CreateIndex
CREATE INDEX "app_user_companyId_idx" ON "app_user"("companyId");

-- CreateIndex
CREATE INDEX "app_user_roleId_idx" ON "app_user"("roleId");

-- CreateIndex
CREATE INDEX "departments_companyId_idx" ON "departments"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "departments_companyId_name_key" ON "departments"("companyId", "name");

-- CreateIndex
CREATE INDEX "job_titles_companyId_idx" ON "job_titles"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "job_titles_companyId_name_key" ON "job_titles"("companyId", "name");

-- CreateIndex
CREATE INDEX "job_level_companyId_idx" ON "job_level"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "job_level_companyId_name_key" ON "job_level"("companyId", "name");

-- CreateIndex
CREATE INDEX "lms_permissions_companyId_idx" ON "lms_permissions"("companyId");

-- CreateIndex
CREATE INDEX "lms_permissions_module_idx" ON "lms_permissions"("module");

-- CreateIndex
CREATE UNIQUE INDEX "lms_permissions_companyId_code_key" ON "lms_permissions"("companyId", "code");

-- CreateIndex
CREATE INDEX "lms_role_permissions_companyId_idx" ON "lms_role_permissions"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "lms_role_permissions_appRoleId_permissionId_key" ON "lms_role_permissions"("appRoleId", "permissionId");

-- CreateIndex
CREATE INDEX "app_role_companyId_idx" ON "app_role"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "app_role_companyId_name_key" ON "app_role"("companyId", "name");

-- CreateIndex
CREATE INDEX "courses_companyId_idx" ON "courses"("companyId");

-- CreateIndex
CREATE INDEX "courses_categoryId_idx" ON "courses"("categoryId");

-- CreateIndex
CREATE INDEX "courses_status_idx" ON "courses"("status");

-- CreateIndex
CREATE INDEX "courses_companyId_status_idx" ON "courses"("companyId", "status");

-- CreateIndex
CREATE INDEX "courses_visibility_idx" ON "courses"("visibility");

-- CreateIndex
CREATE UNIQUE INDEX "courses_companyId_code_key" ON "courses"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "courses_companyId_categoryId_title_key" ON "courses"("companyId", "categoryId", "title");

-- CreateIndex
CREATE INDEX "course_versions_companyId_idx" ON "course_versions"("companyId");

-- CreateIndex
CREATE INDEX "course_versions_courseId_status_idx" ON "course_versions"("courseId", "status");

-- CreateIndex
CREATE INDEX "course_versions_publishDate_idx" ON "course_versions"("publishDate");

-- CreateIndex
CREATE UNIQUE INDEX "course_versions_courseId_majorVersion_minorVersion_key" ON "course_versions"("courseId", "majorVersion", "minorVersion");

-- CreateIndex
CREATE INDEX "course_tags_companyId_idx" ON "course_tags"("companyId");

-- CreateIndex
CREATE INDEX "course_tags_isActive_idx" ON "course_tags"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "course_tags_companyId_name_key" ON "course_tags"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "course_tags_companyId_slug_key" ON "course_tags"("companyId", "slug");

-- CreateIndex
CREATE INDEX "course_tag_mappings_companyId_idx" ON "course_tag_mappings"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "course_tag_mappings_courseId_tagId_key" ON "course_tag_mappings"("courseId", "tagId");

-- CreateIndex
CREATE INDEX "course_announcements_companyId_idx" ON "course_announcements"("companyId");

-- CreateIndex
CREATE INDEX "course_announcements_courseVersionId_idx" ON "course_announcements"("courseVersionId");

-- CreateIndex
CREATE INDEX "course_announcements_publishAt_idx" ON "course_announcements"("publishAt");

-- CreateIndex
CREATE INDEX "course_announcements_expiresAt_idx" ON "course_announcements"("expiresAt");

-- CreateIndex
CREATE INDEX "course_categories_companyId_idx" ON "course_categories"("companyId");

-- CreateIndex
CREATE INDEX "course_categories_parentId_idx" ON "course_categories"("parentId");

-- CreateIndex
CREATE INDEX "course_categories_isActive_isVisible_idx" ON "course_categories"("isActive", "isVisible");

-- CreateIndex
CREATE INDEX "course_categories_displayOrder_idx" ON "course_categories"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "course_categories_companyId_name_key" ON "course_categories"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "course_categories_companyId_slug_key" ON "course_categories"("companyId", "slug");

-- CreateIndex
CREATE INDEX "instructor_roles_companyId_idx" ON "instructor_roles"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "instructor_roles_companyId_name_key" ON "instructor_roles"("companyId", "name");

-- CreateIndex
CREATE INDEX "course_instructors_companyId_idx" ON "course_instructors"("companyId");

-- CreateIndex
CREATE INDEX "course_instructors_courseVersionId_idx" ON "course_instructors"("courseVersionId");

-- CreateIndex
CREATE INDEX "course_instructors_employeeId_idx" ON "course_instructors"("employeeId");

-- CreateIndex
CREATE INDEX "course_instructors_appUserId_idx" ON "course_instructors"("appUserId");

-- CreateIndex
CREATE UNIQUE INDEX "course_skills_courseId_skillId_key" ON "course_skills"("courseId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "skills_companyId_name_key" ON "skills"("companyId", "name");

-- CreateIndex
CREATE INDEX "employee_skill_assessments_companyId_idx" ON "employee_skill_assessments"("companyId");

-- CreateIndex
CREATE INDEX "employee_skill_assessments_employeeId_idx" ON "employee_skill_assessments"("employeeId");

-- CreateIndex
CREATE INDEX "employee_skill_assessments_skillId_idx" ON "employee_skill_assessments"("skillId");

-- CreateIndex
CREATE INDEX "employee_skill_assessments_completionId_idx" ON "employee_skill_assessments"("completionId");

-- CreateIndex
CREATE INDEX "course_prerequisites_companyId_idx" ON "course_prerequisites"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "course_prerequisites_courseId_prerequisiteCourseId_key" ON "course_prerequisites"("courseId", "prerequisiteCourseId");

-- CreateIndex
CREATE INDEX "course_chapters_companyId_idx" ON "course_chapters"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "course_chapters_courseVersionId_displayOrder_key" ON "course_chapters"("courseVersionId", "displayOrder");

-- CreateIndex
CREATE INDEX "chapter_prerequisites_companyId_idx" ON "chapter_prerequisites"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "chapter_prerequisites_chapterId_prerequisiteChapterId_key" ON "chapter_prerequisites"("chapterId", "prerequisiteChapterId");

-- CreateIndex
CREATE INDEX "course_contents_companyId_idx" ON "course_contents"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "course_contents_chapterId_displayOrder_key" ON "course_contents"("chapterId", "displayOrder");

-- CreateIndex
CREATE INDEX "content_files_companyId_idx" ON "content_files"("companyId");

-- CreateIndex
CREATE INDEX "content_files_contentId_idx" ON "content_files"("contentId");

-- CreateIndex
CREATE INDEX "content_files_fileTypeId_idx" ON "content_files"("fileTypeId");

-- CreateIndex
CREATE INDEX "content_files_s3Key_idx" ON "content_files"("s3Key");

-- CreateIndex
CREATE UNIQUE INDEX "ContentType_slug_key" ON "ContentType"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ContentFileType_slug_key" ON "ContentFileType"("slug");

-- CreateIndex
CREATE INDEX "bookmarks_companyId_idx" ON "bookmarks"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_employeeId_courseId_key" ON "bookmarks"("employeeId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "course_reviews_completionId_key" ON "course_reviews"("completionId");

-- CreateIndex
CREATE INDEX "course_reviews_companyId_idx" ON "course_reviews"("companyId");

-- CreateIndex
CREATE INDEX "course_reviews_courseId_idx" ON "course_reviews"("courseId");

-- CreateIndex
CREATE INDEX "course_reviews_rating_idx" ON "course_reviews"("rating");

-- CreateIndex
CREATE INDEX "related_courses_companyId_idx" ON "related_courses"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "related_courses_courseId_relatedCourseId_key" ON "related_courses"("courseId", "relatedCourseId");

-- CreateIndex
CREATE INDEX "course_faqs_companyId_idx" ON "course_faqs"("companyId");

-- CreateIndex
CREATE INDEX "course_faqs_courseId_idx" ON "course_faqs"("courseId");

-- CreateIndex
CREATE INDEX "course_faqs_courseVersionId_idx" ON "course_faqs"("courseVersionId");

-- CreateIndex
CREATE INDEX "target_audiences_companyId_idx" ON "target_audiences"("companyId");

-- CreateIndex
CREATE INDEX "target_audiences_entityType_entityId_idx" ON "target_audiences"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "target_audiences_entityType_entityId_audienceType_departmen_key" ON "target_audiences"("entityType", "entityId", "audienceType", "departmentId", "jobTitleId", "jobLevelId", "appRoleId");

-- CreateIndex
CREATE INDEX "learning_programs_companyId_idx" ON "learning_programs"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "program_types_companyId_name_key" ON "program_types"("companyId", "name");

-- CreateIndex
CREATE INDEX "program_categories_companyId_idx" ON "program_categories"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "program_categories_companyId_name_key" ON "program_categories"("companyId", "name");

-- CreateIndex
CREATE INDEX "program_courses_companyId_idx" ON "program_courses"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "program_courses_programId_courseVersionId_key" ON "program_courses"("programId", "courseVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "program_courses_programId_displayOrder_key" ON "program_courses"("programId", "displayOrder");

-- CreateIndex
CREATE INDEX "program_cohorts_companyId_idx" ON "program_cohorts"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "program_cohorts_programId_name_key" ON "program_cohorts"("programId", "name");

-- CreateIndex
CREATE INDEX "program_enrollments_companyId_idx" ON "program_enrollments"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "program_enrollments_employeeId_programId_key" ON "program_enrollments"("employeeId", "programId");

-- CreateIndex
CREATE INDEX "program_milestones_companyId_idx" ON "program_milestones"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "program_milestones_programId_milestonePercentage_key" ON "program_milestones"("programId", "milestonePercentage");

-- CreateIndex
CREATE INDEX "program_milestone_progresses_companyId_idx" ON "program_milestone_progresses"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "program_milestone_progresses_milestoneId_programEnrollmentI_key" ON "program_milestone_progresses"("milestoneId", "programEnrollmentId");

-- CreateIndex
CREATE INDEX "program_tasks_companyId_idx" ON "program_tasks"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "program_tasks_programId_displayOrder_key" ON "program_tasks"("programId", "displayOrder");

-- CreateIndex
CREATE INDEX "program_task_submissions_companyId_idx" ON "program_task_submissions"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "program_task_submissions_taskId_employeeId_key" ON "program_task_submissions"("taskId", "employeeId");

-- CreateIndex
CREATE INDEX "enrollments_companyId_idx" ON "enrollments"("companyId");

-- CreateIndex
CREATE INDEX "enrollments_employeeId_idx" ON "enrollments"("employeeId");

-- CreateIndex
CREATE INDEX "enrollments_courseVersionId_idx" ON "enrollments"("courseVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_employeeId_courseVersionId_enrollmentNo_key" ON "enrollments"("employeeId", "courseVersionId", "enrollmentNo");

-- CreateIndex
CREATE INDEX "enrollment_rules_companyId_idx" ON "enrollment_rules"("companyId");

-- CreateIndex
CREATE INDEX "enrollment_rules_courseVersionId_idx" ON "enrollment_rules"("courseVersionId");

-- CreateIndex
CREATE INDEX "enrollment_rules_programId_idx" ON "enrollment_rules"("programId");

-- CreateIndex
CREATE INDEX "enrollment_rules_targetAudienceId_idx" ON "enrollment_rules"("targetAudienceId");

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_rules_companyId_name_key" ON "enrollment_rules"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "learning_progress_enrollmentId_key" ON "learning_progress"("enrollmentId");

-- CreateIndex
CREATE INDEX "learning_progress_companyId_idx" ON "learning_progress"("companyId");

-- CreateIndex
CREATE INDEX "lesson_progress_companyId_idx" ON "lesson_progress"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_progress_learningProgressId_contentId_key" ON "lesson_progress"("learningProgressId", "contentId");

-- CreateIndex
CREATE INDEX "learning_sessions_companyId_idx" ON "learning_sessions"("companyId");

-- CreateIndex
CREATE INDEX "learning_sessions_enrollmentId_idx" ON "learning_sessions"("enrollmentId");

-- CreateIndex
CREATE INDEX "enrollment_activity_logs_companyId_idx" ON "enrollment_activity_logs"("companyId");

-- CreateIndex
CREATE INDEX "enrollment_activity_logs_enrollmentId_idx" ON "enrollment_activity_logs"("enrollmentId");

-- CreateIndex
CREATE INDEX "enrollment_activity_logs_activityType_idx" ON "enrollment_activity_logs"("activityType");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_entries_enrollmentId_key" ON "waitlist_entries"("enrollmentId");

-- CreateIndex
CREATE INDEX "waitlist_entries_companyId_idx" ON "waitlist_entries"("companyId");

-- CreateIndex
CREATE INDEX "waitlist_entries_status_idx" ON "waitlist_entries"("status");

-- CreateIndex
CREATE UNIQUE INDEX "course_completions_enrollmentId_key" ON "course_completions"("enrollmentId");

-- CreateIndex
CREATE INDEX "course_completions_companyId_idx" ON "course_completions"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "program_completions_programEnrollmentId_key" ON "program_completions"("programEnrollmentId");

-- CreateIndex
CREATE INDEX "program_completions_companyId_idx" ON "program_completions"("companyId");

-- CreateIndex
CREATE INDEX "assessments_companyId_idx" ON "assessments"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_questions_assessmentId_questionVersionId_key" ON "assessment_questions"("assessmentId", "questionVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "topics_companyId_name_key" ON "topics"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "questions_currentVersionId_key" ON "questions"("currentVersionId");

-- CreateIndex
CREATE INDEX "questions_companyId_idx" ON "questions"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "question_versions_questionId_versionNo_key" ON "question_versions"("questionId", "versionNo");

-- CreateIndex
CREATE UNIQUE INDEX "question_options_questionVersionId_displayOrder_key" ON "question_options"("questionVersionId", "displayOrder");

-- CreateIndex
CREATE INDEX "assessment_attempts_companyId_idx" ON "assessment_attempts"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_attempts_assessmentId_enrollmentId_attemptNo_key" ON "assessment_attempts"("assessmentId", "enrollmentId", "attemptNo");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_answers_attemptId_questionVersionId_key" ON "assessment_answers"("attemptId", "questionVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "certificate_templates_courseVersionId_key" ON "certificate_templates"("courseVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "certificate_templates_learningProgramId_key" ON "certificate_templates"("learningProgramId");

-- CreateIndex
CREATE INDEX "certificate_templates_companyId_idx" ON "certificate_templates"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "certificate_template_signers_templateId_displayOrder_key" ON "certificate_template_signers"("templateId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "certificate_template_signers_templateId_employeeId_key" ON "certificate_template_signers"("templateId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_completionId_key" ON "certificates"("completionId");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_programCompletionId_key" ON "certificates"("programCompletionId");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_verificationCode_key" ON "certificates"("verificationCode");

-- CreateIndex
CREATE INDEX "certificates_companyId_idx" ON "certificates"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_companyId_certificateNumber_key" ON "certificates"("companyId", "certificateNumber");

-- CreateIndex
CREATE INDEX "certificate_verifications_companyId_idx" ON "certificate_verifications"("companyId");

-- CreateIndex
CREATE INDEX "certificate_verifications_certificateId_idx" ON "certificate_verifications"("certificateId");

-- CreateIndex
CREATE INDEX "external_certificates_companyId_idx" ON "external_certificates"("companyId");

-- CreateIndex
CREATE INDEX "external_certificates_employeeId_idx" ON "external_certificates"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "external_providers_companyId_name_key" ON "external_providers"("companyId", "name");

-- CreateIndex
CREATE INDEX "live_sessions_companyId_idx" ON "live_sessions"("companyId");

-- CreateIndex
CREATE INDEX "live_sessions_courseVersionId_idx" ON "live_sessions"("courseVersionId");

-- CreateIndex
CREATE INDEX "live_sessions_startTime_idx" ON "live_sessions"("startTime");

-- CreateIndex
CREATE INDEX "live_session_instructors_companyId_idx" ON "live_session_instructors"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "live_session_instructors_sessionId_employeeId_key" ON "live_session_instructors"("sessionId", "employeeId");

-- CreateIndex
CREATE INDEX "live_session_attendance_companyId_idx" ON "live_session_attendance"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "live_session_attendance_sessionId_enrollmentId_key" ON "live_session_attendance"("sessionId", "enrollmentId");

-- CreateIndex
CREATE INDEX "live_session_waitlists_companyId_idx" ON "live_session_waitlists"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "live_session_waitlists_sessionId_enrollmentId_key" ON "live_session_waitlists"("sessionId", "enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "live_session_waitlists_sessionId_queuePosition_key" ON "live_session_waitlists"("sessionId", "queuePosition");

-- CreateIndex
CREATE INDEX "surveys_companyId_idx" ON "surveys"("companyId");

-- CreateIndex
CREATE INDEX "survey_questions_companyId_idx" ON "survey_questions"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "survey_questions_surveyId_displayOrder_key" ON "survey_questions"("surveyId", "displayOrder");

-- CreateIndex
CREATE INDEX "survey_responses_companyId_idx" ON "survey_responses"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "survey_responses_surveyId_completionId_key" ON "survey_responses"("surveyId", "completionId");

-- CreateIndex
CREATE INDEX "survey_answers_companyId_idx" ON "survey_answers"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "survey_answers_responseId_questionId_key" ON "survey_answers"("responseId", "questionId");

-- CreateIndex
CREATE INDEX "effectiveness_weight_configs_companyId_idx" ON "effectiveness_weight_configs"("companyId");

-- CreateIndex
CREATE INDEX "effectiveness_weight_configs_companyId_isActive_idx" ON "effectiveness_weight_configs"("companyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "training_effectiveness_completionId_key" ON "training_effectiveness"("completionId");

-- CreateIndex
CREATE INDEX "training_effectiveness_companyId_idx" ON "training_effectiveness"("companyId");

-- CreateIndex
CREATE INDEX "tna_request_type_configs_companyId_idx" ON "tna_request_type_configs"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "tna_request_type_configs_companyId_name_key" ON "tna_request_type_configs"("companyId", "name");

-- CreateIndex
CREATE INDEX "tna_approval_workflow_steps_companyId_idx" ON "tna_approval_workflow_steps"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "tna_approval_workflow_steps_companyId_stepOrder_key" ON "tna_approval_workflow_steps"("companyId", "stepOrder");

-- CreateIndex
CREATE INDEX "training_need_requests_companyId_idx" ON "training_need_requests"("companyId");

-- CreateIndex
CREATE INDEX "training_need_requests_employeeId_idx" ON "training_need_requests"("employeeId");

-- CreateIndex
CREATE INDEX "training_need_requests_status_idx" ON "training_need_requests"("status");

-- CreateIndex
CREATE INDEX "training_need_requests_targetAudienceId_idx" ON "training_need_requests"("targetAudienceId");

-- CreateIndex
CREATE INDEX "training_need_requests_departmentId_idx" ON "training_need_requests"("departmentId");

-- CreateIndex
CREATE INDEX "training_need_requests_jobTitleId_idx" ON "training_need_requests"("jobTitleId");

-- CreateIndex
CREATE INDEX "training_need_skills_companyId_idx" ON "training_need_skills"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "training_need_skills_requestId_skillId_key" ON "training_need_skills"("requestId", "skillId");

-- CreateIndex
CREATE INDEX "tna_approvals_requestId_idx" ON "tna_approvals"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "tna_approvals_requestId_workflowStepId_key" ON "tna_approvals"("requestId", "workflowStepId");

-- CreateIndex
CREATE INDEX "tna_recommendations_companyId_idx" ON "tna_recommendations"("companyId");

-- CreateIndex
CREATE INDEX "tna_recommendations_requestId_idx" ON "tna_recommendations"("requestId");

-- CreateIndex
CREATE INDEX "tna_recommendations_targetAudienceId_idx" ON "tna_recommendations"("targetAudienceId");

-- CreateIndex
CREATE INDEX "tna_recommendation_skills_companyId_idx" ON "tna_recommendation_skills"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "tna_recommendation_skills_recommendationId_skillId_key" ON "tna_recommendation_skills"("recommendationId", "skillId");

-- CreateIndex
CREATE INDEX "xp_rules_companyId_idx" ON "xp_rules"("companyId");

-- CreateIndex
CREATE INDEX "xp_rules_targetAudienceId_idx" ON "xp_rules"("targetAudienceId");

-- CreateIndex
CREATE INDEX "xp_rules_courseVersionId_idx" ON "xp_rules"("courseVersionId");

-- CreateIndex
CREATE INDEX "xp_rules_programId_idx" ON "xp_rules"("programId");

-- CreateIndex
CREATE INDEX "xp_transactions_companyId_idx" ON "xp_transactions"("companyId");

-- CreateIndex
CREATE INDEX "xp_transactions_employeeId_idx" ON "xp_transactions"("employeeId");

-- CreateIndex
CREATE INDEX "xp_transactions_createdAt_idx" ON "xp_transactions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "xp_transactions_employeeId_ruleId_sourceId_key" ON "xp_transactions"("employeeId", "ruleId", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "learning_levels_companyId_displayOrder_key" ON "learning_levels"("companyId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "learning_levels_companyId_minimumXp_key" ON "learning_levels"("companyId", "minimumXp");

-- CreateIndex
CREATE UNIQUE INDEX "badges_companyId_name_key" ON "badges"("companyId", "name");

-- CreateIndex
CREATE INDEX "badge_rules_companyId_idx" ON "badge_rules"("companyId");

-- CreateIndex
CREATE INDEX "badge_rules_badgeId_idx" ON "badge_rules"("badgeId");

-- CreateIndex
CREATE INDEX "employee_badges_employeeId_idx" ON "employee_badges"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "employee_badges_badgeId_employeeId_key" ON "employee_badges"("badgeId", "employeeId");

-- CreateIndex
CREATE INDEX "system_settings_companyId_category_idx" ON "system_settings"("companyId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_companyId_settingKey_key" ON "system_settings"("companyId", "settingKey");

-- CreateIndex
CREATE INDEX "course_templates_companyId_idx" ON "course_templates"("companyId");

-- CreateIndex
CREATE INDEX "course_templates_categoryId_idx" ON "course_templates"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "course_templates_companyId_name_key" ON "course_templates"("companyId", "name");

-- CreateIndex
CREATE INDEX "program_templates_companyId_idx" ON "program_templates"("companyId");

-- CreateIndex
CREATE INDEX "program_templates_categoryId_idx" ON "program_templates"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "program_templates_companyId_name_key" ON "program_templates"("companyId", "name");

-- CreateIndex
CREATE INDEX "assessment_templates_companyId_idx" ON "assessment_templates"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_templates_companyId_name_key" ON "assessment_templates"("companyId", "name");

-- CreateIndex
CREATE INDEX "survey_templates_companyId_idx" ON "survey_templates"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "survey_templates_companyId_name_key" ON "survey_templates"("companyId", "name");

-- CreateIndex
CREATE INDEX "notification_templates_companyId_idx" ON "notification_templates"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_companyId_name_key" ON "notification_templates"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationEvent_companyId_code_key" ON "NotificationEvent"("companyId", "code");

-- CreateIndex
CREATE INDEX "learning_path_templates_companyId_idx" ON "learning_path_templates"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "learning_path_templates_companyId_name_key" ON "learning_path_templates"("companyId", "name");

-- CreateIndex
CREATE INDEX "approval_workflows_companyId_idx" ON "approval_workflows"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "approval_workflows_companyId_name_key" ON "approval_workflows"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "approval_workflow_steps_workflowId_approvalOrder_key" ON "approval_workflow_steps"("workflowId", "approvalOrder");

-- CreateIndex
CREATE INDEX "approval_workflow_instances_companyId_idx" ON "approval_workflow_instances"("companyId");

-- CreateIndex
CREATE INDEX "approval_workflow_instances_workflowId_idx" ON "approval_workflow_instances"("workflowId");

-- CreateIndex
CREATE INDEX "approval_workflow_instances_courseVersionId_idx" ON "approval_workflow_instances"("courseVersionId");

-- CreateIndex
CREATE INDEX "approval_workflow_instances_learningProgramId_idx" ON "approval_workflow_instances"("learningProgramId");

-- CreateIndex
CREATE INDEX "approval_decisions_companyId_idx" ON "approval_decisions"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "approval_decisions_instanceId_workflowStepId_key" ON "approval_decisions"("instanceId", "workflowStepId");

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_job_title_id_fkey" FOREIGN KEY ("job_title_id") REFERENCES "job_titles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_user" ADD CONSTRAINT "app_user_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_user" ADD CONSTRAINT "app_user_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_user" ADD CONSTRAINT "app_user_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "app_role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_titles" ADD CONSTRAINT "job_titles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_level" ADD CONSTRAINT "job_level_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_permissions" ADD CONSTRAINT "lms_permissions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_role_permissions" ADD CONSTRAINT "lms_role_permissions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_role_permissions" ADD CONSTRAINT "lms_role_permissions_appRoleId_fkey" FOREIGN KEY ("appRoleId") REFERENCES "app_role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_role_permissions" ADD CONSTRAINT "lms_role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "lms_permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_role" ADD CONSTRAINT "app_role_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "course_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_contactEmployeeId_fkey" FOREIGN KEY ("contactEmployeeId") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_ownerEmployeeId_fkey" FOREIGN KEY ("ownerEmployeeId") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_sourceTemplateId_fkey" FOREIGN KEY ("sourceTemplateId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_versions" ADD CONSTRAINT "course_versions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_versions" ADD CONSTRAINT "course_versions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_versions" ADD CONSTRAINT "course_versions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_versions" ADD CONSTRAINT "course_versions_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_versions" ADD CONSTRAINT "course_versions_publishedBy_fkey" FOREIGN KEY ("publishedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_versions" ADD CONSTRAINT "course_versions_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_tags" ADD CONSTRAINT "course_tags_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_tags" ADD CONSTRAINT "course_tags_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_tags" ADD CONSTRAINT "course_tags_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_tag_mappings" ADD CONSTRAINT "course_tag_mappings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_tag_mappings" ADD CONSTRAINT "course_tag_mappings_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_tag_mappings" ADD CONSTRAINT "course_tag_mappings_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "course_tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_announcements" ADD CONSTRAINT "course_announcements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_announcements" ADD CONSTRAINT "course_announcements_courseVersionId_fkey" FOREIGN KEY ("courseVersionId") REFERENCES "course_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_announcements" ADD CONSTRAINT "course_announcements_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_announcements" ADD CONSTRAINT "course_announcements_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_categories" ADD CONSTRAINT "course_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "course_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_categories" ADD CONSTRAINT "course_categories_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_categories" ADD CONSTRAINT "course_categories_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_categories" ADD CONSTRAINT "course_categories_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_roles" ADD CONSTRAINT "instructor_roles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_instructors" ADD CONSTRAINT "course_instructors_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_instructors" ADD CONSTRAINT "course_instructors_courseVersionId_fkey" FOREIGN KEY ("courseVersionId") REFERENCES "course_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_instructors" ADD CONSTRAINT "course_instructors_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_instructors" ADD CONSTRAINT "course_instructors_appUserId_fkey" FOREIGN KEY ("appUserId") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_instructors" ADD CONSTRAINT "course_instructors_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "instructor_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_skills" ADD CONSTRAINT "course_skills_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_skills" ADD CONSTRAINT "course_skills_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_skills" ADD CONSTRAINT "course_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_skill_assessments" ADD CONSTRAINT "employee_skill_assessments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_skill_assessments" ADD CONSTRAINT "employee_skill_assessments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_skill_assessments" ADD CONSTRAINT "employee_skill_assessments_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_skill_assessments" ADD CONSTRAINT "employee_skill_assessments_completionId_fkey" FOREIGN KEY ("completionId") REFERENCES "course_completions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_skill_assessments" ADD CONSTRAINT "employee_skill_assessments_assessedBy_fkey" FOREIGN KEY ("assessedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_prerequisites" ADD CONSTRAINT "course_prerequisites_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_prerequisites" ADD CONSTRAINT "course_prerequisites_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_prerequisites" ADD CONSTRAINT "course_prerequisites_prerequisiteCourseId_fkey" FOREIGN KEY ("prerequisiteCourseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_chapters" ADD CONSTRAINT "course_chapters_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_chapters" ADD CONSTRAINT "course_chapters_courseVersionId_fkey" FOREIGN KEY ("courseVersionId") REFERENCES "course_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapter_prerequisites" ADD CONSTRAINT "chapter_prerequisites_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapter_prerequisites" ADD CONSTRAINT "chapter_prerequisites_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "course_chapters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapter_prerequisites" ADD CONSTRAINT "chapter_prerequisites_prerequisiteChapterId_fkey" FOREIGN KEY ("prerequisiteChapterId") REFERENCES "course_chapters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_contents" ADD CONSTRAINT "course_contents_contentTypeId_fkey" FOREIGN KEY ("contentTypeId") REFERENCES "ContentType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_contents" ADD CONSTRAINT "course_contents_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_contents" ADD CONSTRAINT "course_contents_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "course_chapters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_files" ADD CONSTRAINT "content_files_fileTypeId_fkey" FOREIGN KEY ("fileTypeId") REFERENCES "ContentFileType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_files" ADD CONSTRAINT "content_files_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_files" ADD CONSTRAINT "content_files_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "course_contents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_files" ADD CONSTRAINT "content_files_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_completionId_fkey" FOREIGN KEY ("completionId") REFERENCES "course_completions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_moderatedBy_fkey" FOREIGN KEY ("moderatedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "related_courses" ADD CONSTRAINT "related_courses_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "related_courses" ADD CONSTRAINT "related_courses_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "related_courses" ADD CONSTRAINT "related_courses_relatedCourseId_fkey" FOREIGN KEY ("relatedCourseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_faqs" ADD CONSTRAINT "course_faqs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_faqs" ADD CONSTRAINT "course_faqs_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_faqs" ADD CONSTRAINT "course_faqs_courseVersionId_fkey" FOREIGN KEY ("courseVersionId") REFERENCES "course_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_faqs" ADD CONSTRAINT "course_faqs_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_faqs" ADD CONSTRAINT "course_faqs_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "target_audiences" ADD CONSTRAINT "target_audiences_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "target_audiences" ADD CONSTRAINT "target_audiences_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "target_audiences" ADD CONSTRAINT "target_audiences_jobTitleId_fkey" FOREIGN KEY ("jobTitleId") REFERENCES "job_titles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "target_audiences" ADD CONSTRAINT "target_audiences_jobLevelId_fkey" FOREIGN KEY ("jobLevelId") REFERENCES "job_level"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "target_audiences" ADD CONSTRAINT "target_audiences_appRoleId_fkey" FOREIGN KEY ("appRoleId") REFERENCES "app_role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "target_audiences" ADD CONSTRAINT "target_audiences_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "target_audiences" ADD CONSTRAINT "target_audiences_learningProgramId_fkey" FOREIGN KEY ("learningProgramId") REFERENCES "learning_programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "target_audiences" ADD CONSTRAINT "target_audiences_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "target_audiences" ADD CONSTRAINT "target_audiences_certificateTemplateId_fkey" FOREIGN KEY ("certificateTemplateId") REFERENCES "certificate_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "target_audiences" ADD CONSTRAINT "target_audiences_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "live_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "target_audiences" ADD CONSTRAINT "target_audiences_courseTemplateId_fkey" FOREIGN KEY ("courseTemplateId") REFERENCES "course_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "target_audiences" ADD CONSTRAINT "target_audiences_programTemplateId_fkey" FOREIGN KEY ("programTemplateId") REFERENCES "program_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "target_audiences" ADD CONSTRAINT "target_audiences_assessmentTemplateId_fkey" FOREIGN KEY ("assessmentTemplateId") REFERENCES "assessment_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_programs" ADD CONSTRAINT "learning_programs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_programs" ADD CONSTRAINT "learning_programs_programTypeId_fkey" FOREIGN KEY ("programTypeId") REFERENCES "program_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_programs" ADD CONSTRAINT "learning_programs_ownerEmployeeId_fkey" FOREIGN KEY ("ownerEmployeeId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_programs" ADD CONSTRAINT "learning_programs_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_programs" ADD CONSTRAINT "learning_programs_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_programs" ADD CONSTRAINT "learning_programs_programCategoryId_fkey" FOREIGN KEY ("programCategoryId") REFERENCES "program_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_types" ADD CONSTRAINT "program_types_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_categories" ADD CONSTRAINT "program_categories_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_categories" ADD CONSTRAINT "program_categories_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_categories" ADD CONSTRAINT "program_categories_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_courses" ADD CONSTRAINT "program_courses_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_courses" ADD CONSTRAINT "program_courses_programId_fkey" FOREIGN KEY ("programId") REFERENCES "learning_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_courses" ADD CONSTRAINT "program_courses_courseVersionId_fkey" FOREIGN KEY ("courseVersionId") REFERENCES "course_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_cohorts" ADD CONSTRAINT "program_cohorts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_cohorts" ADD CONSTRAINT "program_cohorts_programId_fkey" FOREIGN KEY ("programId") REFERENCES "learning_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_enrollments" ADD CONSTRAINT "program_enrollments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_enrollments" ADD CONSTRAINT "program_enrollments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_enrollments" ADD CONSTRAINT "program_enrollments_programId_fkey" FOREIGN KEY ("programId") REFERENCES "learning_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_enrollments" ADD CONSTRAINT "program_enrollments_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "program_cohorts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_enrollments" ADD CONSTRAINT "program_enrollments_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_milestones" ADD CONSTRAINT "program_milestones_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_milestones" ADD CONSTRAINT "program_milestones_programId_fkey" FOREIGN KEY ("programId") REFERENCES "learning_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_milestone_progresses" ADD CONSTRAINT "program_milestone_progresses_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_milestone_progresses" ADD CONSTRAINT "program_milestone_progresses_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "program_milestones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_milestone_progresses" ADD CONSTRAINT "program_milestone_progresses_programEnrollmentId_fkey" FOREIGN KEY ("programEnrollmentId") REFERENCES "program_enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_tasks" ADD CONSTRAINT "program_tasks_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_tasks" ADD CONSTRAINT "program_tasks_programId_fkey" FOREIGN KEY ("programId") REFERENCES "learning_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_tasks" ADD CONSTRAINT "program_tasks_courseVersionId_fkey" FOREIGN KEY ("courseVersionId") REFERENCES "course_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_tasks" ADD CONSTRAINT "program_tasks_courseContentId_fkey" FOREIGN KEY ("courseContentId") REFERENCES "course_contents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_tasks" ADD CONSTRAINT "program_tasks_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_tasks" ADD CONSTRAINT "program_tasks_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "live_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_tasks" ADD CONSTRAINT "program_tasks_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "surveys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_task_submissions" ADD CONSTRAINT "program_task_submissions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_task_submissions" ADD CONSTRAINT "program_task_submissions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "program_tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_task_submissions" ADD CONSTRAINT "program_task_submissions_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_task_submissions" ADD CONSTRAINT "program_task_submissions_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_programEnrollmentId_fkey" FOREIGN KEY ("programEnrollmentId") REFERENCES "program_enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_courseVersionId_fkey" FOREIGN KEY ("courseVersionId") REFERENCES "course_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_rules" ADD CONSTRAINT "enrollment_rules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_rules" ADD CONSTRAINT "enrollment_rules_courseVersionId_fkey" FOREIGN KEY ("courseVersionId") REFERENCES "course_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_rules" ADD CONSTRAINT "enrollment_rules_programId_fkey" FOREIGN KEY ("programId") REFERENCES "learning_programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_rules" ADD CONSTRAINT "enrollment_rules_targetAudienceId_fkey" FOREIGN KEY ("targetAudienceId") REFERENCES "target_audiences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_rules" ADD CONSTRAINT "enrollment_rules_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_rules" ADD CONSTRAINT "enrollment_rules_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_progress" ADD CONSTRAINT "learning_progress_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_progress" ADD CONSTRAINT "learning_progress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_progress" ADD CONSTRAINT "learning_progress_lastContentId_fkey" FOREIGN KEY ("lastContentId") REFERENCES "course_contents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_learningProgressId_fkey" FOREIGN KEY ("learningProgressId") REFERENCES "learning_progress"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "course_contents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_activity_logs" ADD CONSTRAINT "enrollment_activity_logs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_activity_logs" ADD CONSTRAINT "enrollment_activity_logs_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_activity_logs" ADD CONSTRAINT "enrollment_activity_logs_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlist_entries" ADD CONSTRAINT "waitlist_entries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlist_entries" ADD CONSTRAINT "waitlist_entries_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_completions" ADD CONSTRAINT "course_completions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_completions" ADD CONSTRAINT "course_completions_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_completions" ADD CONSTRAINT "program_completions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_completions" ADD CONSTRAINT "program_completions_programEnrollmentId_fkey" FOREIGN KEY ("programEnrollmentId") REFERENCES "program_enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_courseVersionId_fkey" FOREIGN KEY ("courseVersionId") REFERENCES "course_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "course_contents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "assessment_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_pairedAssessmentId_fkey" FOREIGN KEY ("pairedAssessmentId") REFERENCES "assessments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_blueprints" ADD CONSTRAINT "assessment_blueprints_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_blueprints" ADD CONSTRAINT "assessment_blueprints_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_blueprints" ADD CONSTRAINT "assessment_blueprints_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_questionVersionId_fkey" FOREIGN KEY ("questionVersionId") REFERENCES "question_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "question_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_versions" ADD CONSTRAINT "question_versions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_versions" ADD CONSTRAINT "question_versions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_versions" ADD CONSTRAINT "question_versions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_questionVersionId_fkey" FOREIGN KEY ("questionVersionId") REFERENCES "question_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_gradedBy_fkey" FOREIGN KEY ("gradedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_answers" ADD CONSTRAINT "assessment_answers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_answers" ADD CONSTRAINT "assessment_answers_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "assessment_attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_answers" ADD CONSTRAINT "assessment_answers_questionVersionId_fkey" FOREIGN KEY ("questionVersionId") REFERENCES "question_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_answers" ADD CONSTRAINT "assessment_answers_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_templates" ADD CONSTRAINT "certificate_templates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_templates" ADD CONSTRAINT "certificate_templates_courseVersionId_fkey" FOREIGN KEY ("courseVersionId") REFERENCES "course_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_templates" ADD CONSTRAINT "certificate_templates_learningProgramId_fkey" FOREIGN KEY ("learningProgramId") REFERENCES "learning_programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_templates" ADD CONSTRAINT "certificate_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_templates" ADD CONSTRAINT "certificate_templates_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_template_signers" ADD CONSTRAINT "certificate_template_signers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_template_signers" ADD CONSTRAINT "certificate_template_signers_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "certificate_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_template_signers" ADD CONSTRAINT "certificate_template_signers_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_completionId_fkey" FOREIGN KEY ("completionId") REFERENCES "course_completions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_programCompletionId_fkey" FOREIGN KEY ("programCompletionId") REFERENCES "program_completions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "certificate_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_verifications" ADD CONSTRAINT "certificate_verifications_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_verifications" ADD CONSTRAINT "certificate_verifications_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "certificates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_verifications" ADD CONSTRAINT "certificate_verifications_verifiedByEmployeeId_fkey" FOREIGN KEY ("verifiedByEmployeeId") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_certificates" ADD CONSTRAINT "external_certificates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_certificates" ADD CONSTRAINT "external_certificates_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_certificates" ADD CONSTRAINT "external_certificates_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "external_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_providers" ADD CONSTRAINT "external_providers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_courseVersionId_fkey" FOREIGN KEY ("courseVersionId") REFERENCES "course_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_learningProgramId_fkey" FOREIGN KEY ("learningProgramId") REFERENCES "learning_programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_session_instructors" ADD CONSTRAINT "live_session_instructors_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_session_instructors" ADD CONSTRAINT "live_session_instructors_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "live_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_session_instructors" ADD CONSTRAINT "live_session_instructors_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_session_attendance" ADD CONSTRAINT "live_session_attendance_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_session_attendance" ADD CONSTRAINT "live_session_attendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "live_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_session_attendance" ADD CONSTRAINT "live_session_attendance_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_session_waitlists" ADD CONSTRAINT "live_session_waitlists_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_session_waitlists" ADD CONSTRAINT "live_session_waitlists_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "live_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_session_waitlists" ADD CONSTRAINT "live_session_waitlists_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_courseVersionId_fkey" FOREIGN KEY ("courseVersionId") REFERENCES "course_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_questions" ADD CONSTRAINT "survey_questions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_questions" ADD CONSTRAINT "survey_questions_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "surveys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "surveys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_completionId_fkey" FOREIGN KEY ("completionId") REFERENCES "course_completions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "survey_responses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "survey_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "effectiveness_weight_configs" ADD CONSTRAINT "effectiveness_weight_configs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "effectiveness_weight_configs" ADD CONSTRAINT "effectiveness_weight_configs_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_effectiveness" ADD CONSTRAINT "training_effectiveness_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_effectiveness" ADD CONSTRAINT "training_effectiveness_completionId_fkey" FOREIGN KEY ("completionId") REFERENCES "course_completions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tna_request_type_configs" ADD CONSTRAINT "tna_request_type_configs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tna_approval_workflow_steps" ADD CONSTRAINT "tna_approval_workflow_steps_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tna_approval_workflow_steps" ADD CONSTRAINT "tna_approval_workflow_steps_approverJobTitleId_fkey" FOREIGN KEY ("approverJobTitleId") REFERENCES "job_titles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_need_requests" ADD CONSTRAINT "training_need_requests_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_need_requests" ADD CONSTRAINT "training_need_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_need_requests" ADD CONSTRAINT "training_need_requests_requestTypeId_fkey" FOREIGN KEY ("requestTypeId") REFERENCES "tna_request_type_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_need_requests" ADD CONSTRAINT "training_need_requests_targetAudienceId_fkey" FOREIGN KEY ("targetAudienceId") REFERENCES "target_audiences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_need_requests" ADD CONSTRAINT "training_need_requests_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_need_requests" ADD CONSTRAINT "training_need_requests_jobTitleId_fkey" FOREIGN KEY ("jobTitleId") REFERENCES "job_titles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_need_skills" ADD CONSTRAINT "training_need_skills_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_need_skills" ADD CONSTRAINT "training_need_skills_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "training_need_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_need_skills" ADD CONSTRAINT "training_need_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tna_approvals" ADD CONSTRAINT "tna_approvals_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tna_approvals" ADD CONSTRAINT "tna_approvals_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "training_need_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tna_approvals" ADD CONSTRAINT "tna_approvals_workflowStepId_fkey" FOREIGN KEY ("workflowStepId") REFERENCES "tna_approval_workflow_steps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tna_approvals" ADD CONSTRAINT "tna_approvals_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tna_recommendations" ADD CONSTRAINT "tna_recommendations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tna_recommendations" ADD CONSTRAINT "tna_recommendations_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "training_need_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tna_recommendations" ADD CONSTRAINT "tna_recommendations_courseVersionId_fkey" FOREIGN KEY ("courseVersionId") REFERENCES "course_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tna_recommendations" ADD CONSTRAINT "tna_recommendations_learningProgramId_fkey" FOREIGN KEY ("learningProgramId") REFERENCES "learning_programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tna_recommendations" ADD CONSTRAINT "tna_recommendations_targetAudienceId_fkey" FOREIGN KEY ("targetAudienceId") REFERENCES "target_audiences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tna_recommendation_skills" ADD CONSTRAINT "tna_recommendation_skills_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tna_recommendation_skills" ADD CONSTRAINT "tna_recommendation_skills_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "tna_recommendations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tna_recommendation_skills" ADD CONSTRAINT "tna_recommendation_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xp_rules" ADD CONSTRAINT "xp_rules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xp_rules" ADD CONSTRAINT "xp_rules_targetAudienceId_fkey" FOREIGN KEY ("targetAudienceId") REFERENCES "target_audiences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xp_rules" ADD CONSTRAINT "xp_rules_courseVersionId_fkey" FOREIGN KEY ("courseVersionId") REFERENCES "course_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xp_rules" ADD CONSTRAINT "xp_rules_programId_fkey" FOREIGN KEY ("programId") REFERENCES "learning_programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xp_rules" ADD CONSTRAINT "xp_rules_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xp_rules" ADD CONSTRAINT "xp_rules_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xp_transactions" ADD CONSTRAINT "xp_transactions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xp_transactions" ADD CONSTRAINT "xp_transactions_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xp_transactions" ADD CONSTRAINT "xp_transactions_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "xp_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_levels" ADD CONSTRAINT "learning_levels_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badges" ADD CONSTRAINT "badges_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge_rules" ADD CONSTRAINT "badge_rules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge_rules" ADD CONSTRAINT "badge_rules_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge_rules" ADD CONSTRAINT "badge_rules_targetAudienceId_fkey" FOREIGN KEY ("targetAudienceId") REFERENCES "target_audiences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_badges" ADD CONSTRAINT "employee_badges_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_badges" ADD CONSTRAINT "employee_badges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_badges" ADD CONSTRAINT "employee_badges_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_badges" ADD CONSTRAINT "employee_badges_awardedBy_fkey" FOREIGN KEY ("awardedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_badges" ADD CONSTRAINT "employee_badges_revokedBy_fkey" FOREIGN KEY ("revokedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_templates" ADD CONSTRAINT "course_templates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_templates" ADD CONSTRAINT "course_templates_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "course_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_templates" ADD CONSTRAINT "course_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_templates" ADD CONSTRAINT "course_templates_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_templates" ADD CONSTRAINT "program_templates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_templates" ADD CONSTRAINT "program_templates_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "program_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_templates" ADD CONSTRAINT "program_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_templates" ADD CONSTRAINT "program_templates_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_templates" ADD CONSTRAINT "assessment_templates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_templates" ADD CONSTRAINT "assessment_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_templates" ADD CONSTRAINT "assessment_templates_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_templates" ADD CONSTRAINT "survey_templates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_templates" ADD CONSTRAINT "survey_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_templates" ADD CONSTRAINT "survey_templates_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_notificationEventId_fkey" FOREIGN KEY ("notificationEventId") REFERENCES "NotificationEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationEvent" ADD CONSTRAINT "NotificationEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_templates" ADD CONSTRAINT "learning_path_templates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_templates" ADD CONSTRAINT "learning_path_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_templates" ADD CONSTRAINT "learning_path_templates_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_workflows" ADD CONSTRAINT "approval_workflows_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_workflows" ADD CONSTRAINT "approval_workflows_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_workflows" ADD CONSTRAINT "approval_workflows_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_workflow_steps" ADD CONSTRAINT "approval_workflow_steps_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "approval_workflows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_workflow_steps" ADD CONSTRAINT "approval_workflow_steps_approverEmployeeId_fkey" FOREIGN KEY ("approverEmployeeId") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_workflow_instances" ADD CONSTRAINT "approval_workflow_instances_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_workflow_instances" ADD CONSTRAINT "approval_workflow_instances_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "approval_workflows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_workflow_instances" ADD CONSTRAINT "approval_workflow_instances_courseVersionId_fkey" FOREIGN KEY ("courseVersionId") REFERENCES "course_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_workflow_instances" ADD CONSTRAINT "approval_workflow_instances_learningProgramId_fkey" FOREIGN KEY ("learningProgramId") REFERENCES "learning_programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_workflow_instances" ADD CONSTRAINT "approval_workflow_instances_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_decisions" ADD CONSTRAINT "approval_decisions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_decisions" ADD CONSTRAINT "approval_decisions_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "approval_workflow_instances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_decisions" ADD CONSTRAINT "approval_decisions_workflowStepId_fkey" FOREIGN KEY ("workflowStepId") REFERENCES "approval_workflow_steps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_decisions" ADD CONSTRAINT "approval_decisions_decidedBy_fkey" FOREIGN KEY ("decidedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
