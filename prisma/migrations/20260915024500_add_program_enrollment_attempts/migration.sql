-- Program enrollments are attempt records. Preserve every existing row as the
-- first legacy attempt before enforcing attempt-aware uniqueness.
CREATE TYPE "ProgramEnrollmentSource" AS ENUM (
  'LEGACY',
  'SELF_SERVICE',
  'ADMIN_ASSIGNED',
  'WAITLIST',
  'API',
  'CSV_IMPORT',
  'HRIS_SYNC'
);

ALTER TABLE "program_enrollments"
  ADD COLUMN "enrollmentNo" INTEGER,
  ADD COLUMN "source" "ProgramEnrollmentSource";

UPDATE "program_enrollments"
SET "enrollmentNo" = 1,
    "source" = 'LEGACY'
WHERE "enrollmentNo" IS NULL
   OR "source" IS NULL;

ALTER TABLE "program_enrollments"
  ALTER COLUMN "enrollmentNo" SET DEFAULT 1,
  ALTER COLUMN "enrollmentNo" SET NOT NULL,
  ALTER COLUMN "source" SET NOT NULL;

-- New acceptances store the exact attempt they created. Existing accepted
-- entries remain nullable because inferring a historical link would be unsafe.
ALTER TABLE "program_waitlist_entries"
  ADD COLUMN "programEnrollmentId" INTEGER;

CREATE UNIQUE INDEX "program_waitlist_entries_programEnrollmentId_key"
ON "program_waitlist_entries" ("programEnrollmentId");

ALTER TABLE "program_waitlist_entries"
ADD CONSTRAINT "program_waitlist_entries_programEnrollmentId_fkey"
FOREIGN KEY ("programEnrollmentId") REFERENCES "program_enrollments"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

DROP INDEX "program_enrollments_employeeId_programId_key";
CREATE UNIQUE INDEX "program_enrollments_employeeId_programId_enrollmentNo_key"
ON "program_enrollments" ("employeeId", "programId", "enrollmentNo");

-- Partial indexes are not expressible in Prisma. Fail before creating them if
-- unexpected legacy data violates the runtime invariants; never choose or
-- delete a winner automatically.
DO $$
DECLARE
  duplicate_live_program_attempt_count BIGINT;
  duplicate_live_linked_course_count BIGINT;
BEGIN
  SELECT COUNT(*)
  INTO duplicate_live_program_attempt_count
  FROM (
    SELECT "companyId", "employeeId", "programId"
    FROM "program_enrollments"
    WHERE "deletedAt" IS NULL
      AND "enrollmentStatus" IN ('PENDING', 'WAITLISTED', 'ACTIVE')
    GROUP BY "companyId", "employeeId", "programId"
    HAVING COUNT(*) > 1
  ) AS duplicate_live_program_attempts;

  IF duplicate_live_program_attempt_count > 0 THEN
    RAISE EXCEPTION
      'Cannot enforce one live program attempt: % company/employee/program combination(s) have duplicate non-deleted PENDING, WAITLISTED, or ACTIVE attempts.',
      duplicate_live_program_attempt_count
      USING HINT = 'Resolve duplicate live program attempts without deleting history, then retry the migration.';
  END IF;

  SELECT COUNT(*)
  INTO duplicate_live_linked_course_count
  FROM (
    SELECT "programEnrollmentId", "courseVersionId"
    FROM "enrollments"
    WHERE "programEnrollmentId" IS NOT NULL
      AND "deletedAt" IS NULL
      AND "status" IN ('PENDING', 'WAITLISTED', 'ACTIVE')
    GROUP BY "programEnrollmentId", "courseVersionId"
    HAVING COUNT(*) > 1
  ) AS duplicate_live_linked_courses;

  IF duplicate_live_linked_course_count > 0 THEN
    RAISE EXCEPTION
      'Cannot enforce linked-course uniqueness: % program-attempt/course-version combination(s) have duplicate non-deleted live course enrollments.',
      duplicate_live_linked_course_count
      USING HINT = 'Resolve duplicate live linked course enrollments without deleting history, then retry the migration.';
  END IF;
END $$;

CREATE UNIQUE INDEX "program_enrollments_one_live_attempt_key"
ON "program_enrollments" ("companyId", "employeeId", "programId")
WHERE "deletedAt" IS NULL
  AND "enrollmentStatus" IN ('PENDING', 'WAITLISTED', 'ACTIVE');

CREATE UNIQUE INDEX "enrollments_one_live_program_course_key"
ON "enrollments" ("programEnrollmentId", "courseVersionId")
WHERE "programEnrollmentId" IS NOT NULL
  AND "deletedAt" IS NULL
  AND "status" IN ('PENDING', 'WAITLISTED', 'ACTIVE');
