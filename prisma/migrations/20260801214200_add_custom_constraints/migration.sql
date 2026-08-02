-- This is an empty migration.-- ============================================================
-- 1. COURSE INSTRUCTORS (XOR Identity Constraint)
-- ============================================================
ALTER TABLE course_instructors
DROP CONSTRAINT IF EXISTS chk_instructor_one_identity;

ALTER TABLE course_instructors
ADD CONSTRAINT chk_instructor_one_identity
CHECK (
  ("employeeId" IS NOT NULL AND "appUserId" IS NULL)
  OR
  ("employeeId" IS NULL AND "appUserId" IS NOT NULL)
);

-- ============================================================
-- 2. COURSE PREREQUISITES (Anti Self-Reference)
-- ============================================================
ALTER TABLE course_prerequisites
DROP CONSTRAINT IF EXISTS chk_prerequisite_not_self;

ALTER TABLE course_prerequisites
ADD CONSTRAINT chk_prerequisite_not_self
CHECK ("courseId" <> "prerequisiteCourseId");

-- ============================================================
-- 3. COURSE VERSIONS (Single Published Version per Course)
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS one_published_version_per_course
ON course_versions ("courseId")
WHERE status = 'PUBLISHED' AND "deletedAt" IS NULL;

-- ============================================================
-- 4. ASSESSMENT ATTEMPTS (Single Active Attempt Constraint)
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS one_active_attempt_per_enrollment_assessment
ON assessment_attempts ("enrollmentId", "assessmentId")
WHERE status = 'IN_PROGRESS' AND "deletedAt" IS NULL;

-- ============================================================
-- 5. LIVE SESSIONS & INSTRUCTORS (Time Order & XOR Identity)
-- ============================================================
-- Validate that end time comes after start time
ALTER TABLE live_sessions
DROP CONSTRAINT IF EXISTS chk_session_time_order;

ALTER TABLE live_sessions
ADD CONSTRAINT chk_session_time_order
CHECK ("endTime" > "startTime");

-- Ensure LiveSessionInstructor belongs to either Employee OR AppUser
ALTER TABLE live_session_instructors
DROP CONSTRAINT IF EXISTS chk_live_instructor_one_identity;

ALTER TABLE live_session_instructors
ADD CONSTRAINT chk_live_instructor_one_identity
CHECK (
  ("employeeId" IS NOT NULL AND "appUserId" IS NULL)
  OR
  ("employeeId" IS NULL AND "appUserId" IS NOT NULL)
);

-- ============================================================
-- 6. LIVE SESSION ATTENDANCE (Time Validation)
-- ============================================================
ALTER TABLE live_session_attendance
DROP CONSTRAINT IF EXISTS chk_checkout_after_checkin;

ALTER TABLE live_session_attendance
ADD CONSTRAINT chk_checkout_after_checkin
CHECK (
  "checkOutTime" IS NULL
  OR "checkInTime" IS NULL
  OR "checkOutTime" > "checkInTime"
);

-- ============================================================
-- 7. CERTIFICATES (Single Source Discriminator)
-- ============================================================
ALTER TABLE certificates
DROP CONSTRAINT IF EXISTS chk_certificate_one_source;

ALTER TABLE certificates
ADD CONSTRAINT chk_certificate_one_source
CHECK (
  ("issuanceType" = 'COURSE_COMPLETION' AND "completionId" IS NOT NULL AND "programCompletionId" IS NULL)
  OR
  ("issuanceType" = 'PROGRAM_COMPLETION' AND "programCompletionId" IS NOT NULL AND "completionId" IS NULL)
  OR
  ("issuanceType" = 'MANUAL' AND "completionId" IS NULL AND "programCompletionId" IS NULL)
);

-- ============================================================
-- 8. SUBMISSIONS (XOR Content vs Task Assignment)
-- ============================================================
ALTER TABLE submissions
DROP CONSTRAINT IF EXISTS chk_submission_one_owner;

ALTER TABLE submissions
ADD CONSTRAINT chk_submission_one_owner
CHECK (
  ("courseContentId" IS NOT NULL AND "programTaskId" IS NULL)
  OR
  ("courseContentId" IS NULL AND "programTaskId" IS NOT NULL)
);

-- ============================================================
-- 9. STORED FILES (Strict 2-Owner XOR Constraint)
-- ============================================================
ALTER TABLE stored_files
DROP CONSTRAINT IF EXISTS chk_file_one_owner;

ALTER TABLE stored_files
ADD CONSTRAINT chk_file_one_owner
CHECK (
  ("courseContentId" IS NOT NULL AND "submissionId" IS NULL)
  OR
  ("courseContentId" IS NULL AND "submissionId" IS NOT NULL)
);

-- ============================================================
-- 10. AUDIENCE GROUP RULES (Deduplication with COALESCE)
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_audience_group_rule
ON audience_group_rules (
  "audienceGroupId",
  COALESCE("departmentId", -1),
  COALESCE("appRoleId", -1),
  COALESCE("jobTitleId", -1),
  COALESCE("jobLevelId", -1),
  COALESCE("employmentTypeId", -1),
  COALESCE("hireWithinDays", -1),
  "operator",
  "isExclusion"
);	