-- Certificate issuance resolves a template by exactly one owning course version or
-- learning program and expects at most one active PUBLISHED template for that owner.
-- Do not guess owners or silently choose a published winner for legacy conflicts:
-- either action could issue the wrong certificate. Fail with actionable diagnostics
-- before adding the constraints instead.
DO $$
DECLARE
  invalid_owner_count BIGINT;
  duplicate_course_owner_count BIGINT;
  duplicate_program_owner_count BIGINT;
BEGIN
  SELECT COUNT(*)
  INTO invalid_owner_count
  FROM "certificate_templates"
  WHERE ("courseVersionId" IS NULL) = ("learningProgramId" IS NULL);

  IF invalid_owner_count > 0 THEN
    RAISE EXCEPTION
      'Cannot enforce certificate-template owner XOR: % row(s) have both owners set or neither owner set.',
      invalid_owner_count
      USING HINT = 'Set exactly one of courseVersionId or learningProgramId on every certificate_templates row, then retry the migration.';
  END IF;

  SELECT COUNT(*)
  INTO duplicate_course_owner_count
  FROM (
    SELECT "courseVersionId"
    FROM "certificate_templates"
    WHERE "courseVersionId" IS NOT NULL
      AND "status" = 'PUBLISHED'
      AND "deletedAt" IS NULL
    GROUP BY "courseVersionId"
    HAVING COUNT(*) > 1
  ) AS duplicate_course_owners;

  IF duplicate_course_owner_count > 0 THEN
    RAISE EXCEPTION
      'Cannot enforce published certificate-template uniqueness: % course version(s) have multiple active PUBLISHED templates.',
      duplicate_course_owner_count
      USING HINT = 'Archive, retire, soft-delete, or move all but one PUBLISHED template for each courseVersionId, then retry the migration.';
  END IF;

  SELECT COUNT(*)
  INTO duplicate_program_owner_count
  FROM (
    SELECT "learningProgramId"
    FROM "certificate_templates"
    WHERE "learningProgramId" IS NOT NULL
      AND "status" = 'PUBLISHED'
      AND "deletedAt" IS NULL
    GROUP BY "learningProgramId"
    HAVING COUNT(*) > 1
  ) AS duplicate_program_owners;

  IF duplicate_program_owner_count > 0 THEN
    RAISE EXCEPTION
      'Cannot enforce published certificate-template uniqueness: % learning program(s) have multiple active PUBLISHED templates.',
      duplicate_program_owner_count
      USING HINT = 'Archive, retire, soft-delete, or move all but one PUBLISHED template for each learningProgramId, then retry the migration.';
  END IF;
END $$;

ALTER TABLE "certificate_templates"
ADD CONSTRAINT "certificate_templates_exactly_one_owner_check"
CHECK (
  ("courseVersionId" IS NOT NULL AND "learningProgramId" IS NULL)
  OR
  ("courseVersionId" IS NULL AND "learningProgramId" IS NOT NULL)
);

CREATE UNIQUE INDEX "certificate_templates_one_published_course_version_key"
ON "certificate_templates" ("courseVersionId")
WHERE "courseVersionId" IS NOT NULL
  AND "status" = 'PUBLISHED'
  AND "deletedAt" IS NULL;

CREATE UNIQUE INDEX "certificate_templates_one_published_learning_program_key"
ON "certificate_templates" ("learningProgramId")
WHERE "learningProgramId" IS NOT NULL
  AND "status" = 'PUBLISHED'
  AND "deletedAt" IS NULL;
