CREATE TABLE "completion_outbox" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "eventKey" VARCHAR(100) NOT NULL,
    "eventType" VARCHAR(40) NOT NULL,
    "courseCompletionId" INTEGER,
    "programCompletionId" INTEGER,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "completion_outbox_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "completion_outbox_one_source" CHECK (
      ("eventType" = 'COURSE_COMPLETED' AND "courseCompletionId" IS NOT NULL AND "programCompletionId" IS NULL)
      OR
      ("eventType" = 'PROGRAM_COMPLETED' AND "programCompletionId" IS NOT NULL AND "courseCompletionId" IS NULL)
    ),
    CONSTRAINT "completion_outbox_status" CHECK ("status" IN ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED'))
);

CREATE UNIQUE INDEX "completion_outbox_eventKey_key" ON "completion_outbox"("eventKey");
CREATE INDEX "completion_outbox_status_availableAt_idx" ON "completion_outbox"("status", "availableAt");
CREATE INDEX "completion_outbox_companyId_idx" ON "completion_outbox"("companyId");
