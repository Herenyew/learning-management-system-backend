-- CreateTable
CREATE TABLE "program_waitlist_entries" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "programId" INTEGER NOT NULL,
    "cohortId" INTEGER NOT NULL,
    "employeeId" VARCHAR(20) NOT NULL,
    "position" INTEGER NOT NULL,
    "status" "WaitlistStatus" NOT NULL DEFAULT 'WAITING',
    "activeKey" VARCHAR(100),
    "offeredAt" TIMESTAMP(3),
    "offerExpiresAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_waitlist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "program_waitlist_entries_activeKey_key" ON "program_waitlist_entries"("activeKey");

-- CreateIndex
CREATE UNIQUE INDEX "program_waitlist_entries_cohortId_position_key" ON "program_waitlist_entries"("cohortId", "position");

-- CreateIndex
CREATE INDEX "program_waitlist_entries_companyId_programId_cohortId_status_position_idx" ON "program_waitlist_entries"("companyId", "programId", "cohortId", "status", "position");

-- CreateIndex
CREATE INDEX "program_waitlist_entries_companyId_employeeId_status_idx" ON "program_waitlist_entries"("companyId", "employeeId", "status");

-- CreateIndex
CREATE INDEX "program_waitlist_entries_offerExpiresAt_status_idx" ON "program_waitlist_entries"("offerExpiresAt", "status");

-- AddForeignKey
ALTER TABLE "program_waitlist_entries" ADD CONSTRAINT "program_waitlist_entries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_waitlist_entries" ADD CONSTRAINT "program_waitlist_entries_programId_fkey" FOREIGN KEY ("programId") REFERENCES "learning_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_waitlist_entries" ADD CONSTRAINT "program_waitlist_entries_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "program_cohorts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_waitlist_entries" ADD CONSTRAINT "program_waitlist_entries_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
