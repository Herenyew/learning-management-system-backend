-- =========================================================================
-- CUSTOM ENTERPRISE BUSINESS RULES & CONSTRAINTS (CAMELCASE / PASCALCASE)
-- =========================================================================

-- CourseInstructor: exactly one of employeeId/appUserId, never both/neither
ALTER TABLE "course_instructors" 
ADD CONSTRAINT chk_instructor_one_identity 
CHECK (("employeeId" IS NOT NULL AND "appUserId" IS NULL) OR ("employeeId" IS NULL AND "appUserId" IS NOT NULL));

-- CoursePrerequisite: course can't require itself
ALTER TABLE "course_prerequisites" 
ADD CONSTRAINT chk_prerequisite_not_self 
CHECK ("courseId" != "prerequisiteCourseId");

-- ChapterPrerequisite: same, at chapter level
ALTER TABLE "chapter_prerequisites" 
ADD CONSTRAINT chk_chapter_prerequisite_not_self 
CHECK ("chapterId" != "prerequisiteChapterId");

-- CourseVersion: only one PUBLISHED version per course
CREATE UNIQUE INDEX one_published_version_per_course 
ON "course_versions" ("courseId") 
WHERE "status" = 'PUBLISHED' AND "deletedAt" IS NULL;

-- Enrollment: only one active enrollment per employee per course version
CREATE UNIQUE INDEX one_active_enrollment_per_employee_version 
ON "enrollments" ("employeeId", "courseVersionId") 
WHERE "status" IN ('PENDING','ACTIVE','WAITLISTED') AND "deletedAt" IS NULL;
