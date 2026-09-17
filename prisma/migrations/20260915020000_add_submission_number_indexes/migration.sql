ALTER TABLE "submissions"
ADD COLUMN "programEnrollmentId" INTEGER;

ALTER TABLE "submissions"
ADD CONSTRAINT "submissions_programEnrollmentId_fkey"
FOREIGN KEY ("programEnrollmentId") REFERENCES "program_enrollments"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "submissions_programEnrollmentId_idx"
ON "submissions"("programEnrollmentId");

-- PostgreSQL treats NULL values as distinct in the original four-column unique
-- constraint, so it cannot protect submission numbers for XOR-owned rows.
CREATE UNIQUE INDEX "submission_program_task_number_unique"
ON "submissions" ("companyId", "programEnrollmentId", "programTaskId", "submissionNo")
WHERE "programTaskId" IS NOT NULL AND "programEnrollmentId" IS NOT NULL AND "deletedAt" IS NULL;

CREATE UNIQUE INDEX "submission_course_content_number_unique"
ON "submissions" ("companyId", "enrollmentId", "courseContentId", "submissionNo")
WHERE "courseContentId" IS NOT NULL AND "enrollmentId" IS NOT NULL AND "deletedAt" IS NULL;
