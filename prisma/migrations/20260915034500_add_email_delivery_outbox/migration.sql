CREATE TABLE "email_delivery_outbox" (
  "id" SERIAL NOT NULL,
  "companyId" INTEGER NOT NULL,
  "eventKey" VARCHAR(120) NOT NULL,
  "payload" JSONB NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lockedAt" TIMESTAMP(3),
  "processedAt" TIMESTAMP(3),
  "providerId" VARCHAR(255),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "email_delivery_outbox_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "email_delivery_outbox_eventKey_key"
ON "email_delivery_outbox" ("eventKey");
CREATE INDEX "email_delivery_outbox_status_availableAt_idx"
ON "email_delivery_outbox" ("status", "availableAt");
CREATE INDEX "email_delivery_outbox_companyId_idx"
ON "email_delivery_outbox" ("companyId");

ALTER TABLE "email_delivery_outbox"
ADD CONSTRAINT "email_delivery_outbox_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "company"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
