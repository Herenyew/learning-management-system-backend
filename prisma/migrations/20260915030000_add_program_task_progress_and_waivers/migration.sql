CREATE TYPE "ProgramTaskProgressStatus" AS ENUM (
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'WAIVED'
);

CREATE TABLE "program_task_progresses" (
  "id" SERIAL NOT NULL,
  "companyId" INTEGER NOT NULL,
  "programTaskId" INTEGER NOT NULL,
  "programEnrollmentId" INTEGER NOT NULL,
  "status" "ProgramTaskProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "completedAt" TIMESTAMP(3),
  "waivedAt" TIMESTAMP(3),
  "waivedBy" INTEGER,
  "waiverReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "program_task_progresses_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "program_task_progresses_state_check" CHECK (
    ("status" = 'COMPLETED' AND "completedAt" IS NOT NULL AND "waivedAt" IS NULL AND "waivedBy" IS NULL AND "waiverReason" IS NULL)
    OR
    ("status" = 'WAIVED' AND "completedAt" IS NULL AND "waivedAt" IS NOT NULL AND "waivedBy" IS NOT NULL AND "waiverReason" IS NOT NULL AND LENGTH(BTRIM("waiverReason")) > 0)
    OR
    ("status" IN ('NOT_STARTED', 'IN_PROGRESS') AND "completedAt" IS NULL AND "waivedAt" IS NULL AND "waivedBy" IS NULL AND "waiverReason" IS NULL)
  )
);

CREATE UNIQUE INDEX "program_task_progresses_programTaskId_programEnrollmentId_key"
ON "program_task_progresses"("programTaskId", "programEnrollmentId");

CREATE INDEX "program_task_progresses_companyId_idx"
ON "program_task_progresses"("companyId");

CREATE INDEX "program_task_progresses_programEnrollmentId_idx"
ON "program_task_progresses"("programEnrollmentId");

CREATE INDEX "program_task_progresses_waivedBy_idx"
ON "program_task_progresses"("waivedBy");

ALTER TABLE "program_task_progresses"
ADD CONSTRAINT "program_task_progresses_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "program_task_progresses"
ADD CONSTRAINT "program_task_progresses_programTaskId_fkey"
FOREIGN KEY ("programTaskId") REFERENCES "program_tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "program_task_progresses"
ADD CONSTRAINT "program_task_progresses_programEnrollmentId_fkey"
FOREIGN KEY ("programEnrollmentId") REFERENCES "program_enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "program_task_progresses"
ADD CONSTRAINT "program_task_progresses_waivedBy_fkey"
FOREIGN KEY ("waivedBy") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed attempt-scoped state from submission evidence only. The evaluator updates
-- linked course/content/assessment/session/survey requirements authoritatively.
INSERT INTO "program_task_progresses" (
  "companyId",
  "programTaskId",
  "programEnrollmentId",
  "status",
  "completedAt",
  "createdAt",
  "updatedAt"
)
SELECT
  pe."companyId",
  pt."id",
  pe."id",
  CASE
    WHEN accepted."id" IS NOT NULL
      AND tt."linkedEntity" = 'NONE'
      AND (NOT pt."requiresManagerApproval" OR accepted."status" = 'APPROVED')
      AND (NOT pt."peerReviewRequired" OR accepted."peerReviewCount" >= COALESCE(pt."requiredPeerReviewCount", 3))
      AND (pt."minimumScore" IS NULL OR accepted."score" >= pt."minimumScore")
      THEN 'COMPLETED'::"ProgramTaskProgressStatus"
    WHEN attempted."id" IS NOT NULL THEN 'IN_PROGRESS'::"ProgramTaskProgressStatus"
    ELSE 'NOT_STARTED'::"ProgramTaskProgressStatus"
  END,
  CASE
    WHEN accepted."id" IS NOT NULL
      AND tt."linkedEntity" = 'NONE'
      AND (NOT pt."requiresManagerApproval" OR accepted."status" = 'APPROVED')
      AND (NOT pt."peerReviewRequired" OR accepted."peerReviewCount" >= COALESCE(pt."requiredPeerReviewCount", 3))
      AND (pt."minimumScore" IS NULL OR accepted."score" >= pt."minimumScore")
      THEN COALESCE(accepted."completedAt", CURRENT_TIMESTAMP)
  END,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "program_enrollments" pe
JOIN "program_tasks" pt
  ON pt."programId" = pe."programId"
 AND pt."companyId" = pe."companyId"
 AND pt."deletedAt" IS NULL
JOIN "task_types" tt
  ON tt."id" = pt."taskTypeId"
 AND tt."companyId" = pe."companyId"
LEFT JOIN LATERAL (
  SELECT s."id"
  FROM "submissions" s
  WHERE s."companyId" = pe."companyId"
    AND s."programTaskId" = pt."id"
    AND s."programEnrollmentId" = pe."id"
    AND s."employeeId" = pe."employeeId"
    AND s."deletedAt" IS NULL
  ORDER BY s."submissionNo" DESC, s."id" DESC
  LIMIT 1
) attempted ON TRUE
LEFT JOIN LATERAL (
  SELECT
    s."id",
    s."status",
    s."score",
    s."completedAt",
    (SELECT COUNT(*) FROM "submission_peer_reviews" spr WHERE spr."submissionId" = s."id") AS "peerReviewCount"
  FROM "submissions" s
  WHERE s."companyId" = pe."companyId"
    AND s."programTaskId" = pt."id"
    AND s."programEnrollmentId" = pe."id"
    AND s."employeeId" = pe."employeeId"
    AND s."deletedAt" IS NULL
    AND s."status" IN ('APPROVED', 'COMPLETED')
  ORDER BY s."submissionNo" DESC, s."id" DESC
  LIMIT 1
) accepted ON TRUE
WHERE pe."deletedAt" IS NULL;
