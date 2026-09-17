ALTER TABLE "survey_responses"
  ALTER COLUMN "completionId" DROP NOT NULL,
  ADD COLUMN "programEnrollmentId" INTEGER;

ALTER TABLE "survey_responses"
ADD CONSTRAINT "survey_responses_owner_check"
CHECK (
  ("completionId" IS NOT NULL AND "programEnrollmentId" IS NULL)
  OR
  ("completionId" IS NULL AND "programEnrollmentId" IS NOT NULL)
);

ALTER TABLE "survey_responses"
ADD CONSTRAINT "survey_responses_programEnrollmentId_fkey"
FOREIGN KEY ("programEnrollmentId") REFERENCES "program_enrollments"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "survey_responses_surveyId_programEnrollmentId_key"
ON "survey_responses" ("surveyId", "programEnrollmentId");

CREATE INDEX "survey_responses_programEnrollmentId_idx"
ON "survey_responses" ("programEnrollmentId");
