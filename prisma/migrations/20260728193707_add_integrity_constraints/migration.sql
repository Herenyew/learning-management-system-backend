-- 1. CourseInstructor: only one identity

ALTER TABLE course_instructors
ADD CONSTRAINT chk_instructor_one_identity
CHECK (
  ("employeeId" IS NOT NULL AND "appUserId" IS NULL)
  OR
  ("employeeId" IS NULL AND "appUserId" IS NOT NULL)
);

-- 2. CoursePrerequisite: cannot reference itself
ALTER TABLE course_prerequisites
ADD CONSTRAINT chk_prerequisite_not_self
CHECK ("courseId" <> "prerequisiteCourseId");

-- 3. Only one published version per course
CREATE UNIQUE INDEX one_published_version_per_course
ON course_versions ("courseId")
WHERE status = 'PUBLISHED' AND "deletedAt" IS NULL;

-- 4. Only one in-progress attempt per enrollment + assessment
CREATE UNIQUE INDEX one_active_attempt_per_enrollment_assessment
ON assessment_attempts ("enrollmentId", "assessmentId")
WHERE status = 'IN_PROGRESS' AND "deletedAt" IS NULL;

-- 5. LiveSession time order
ALTER TABLE live_sessions
ADD CONSTRAINT chk_session_time_order
CHECK ("endTime" > "startTime");

-- 6. Attendance check-out after check-in
ALTER TABLE live_session_attendance
ADD CONSTRAINT chk_checkout_after_checkin
CHECK (
  "checkOutTime" IS NULL
  OR "checkInTime" IS NULL
  OR "checkOutTime" > "checkInTime"
);