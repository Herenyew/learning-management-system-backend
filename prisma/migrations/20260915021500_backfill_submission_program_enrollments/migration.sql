-- Backfill legacy Program task submissions only when the task's Program and
-- employee identify the existing Program enrollment unambiguously.
UPDATE "submissions" AS submission
SET "programEnrollmentId" = enrollment."id"
FROM "program_tasks" AS task
JOIN "program_enrollments" AS enrollment
  ON enrollment."programId" = task."programId"
 AND enrollment."deletedAt" IS NULL
WHERE submission."programTaskId" = task."id"
  AND submission."employeeId" = enrollment."employeeId"
  AND submission."companyId" = enrollment."companyId"
  AND submission."programEnrollmentId" IS NULL
  AND submission."deletedAt" IS NULL;
