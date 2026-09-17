ALTER TABLE "program_courses"
ADD COLUMN "phaseNumber" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "program_courses"
ADD CONSTRAINT "program_courses_phaseNumber_positive_check"
CHECK ("phaseNumber" > 0);

ALTER TABLE "program_tasks"
ADD CONSTRAINT "program_tasks_phaseNumber_positive_check"
CHECK ("phaseNumber" IS NULL OR "phaseNumber" > 0);

CREATE INDEX "program_courses_programId_phaseNumber_displayOrder_idx"
ON "program_courses" ("programId", "phaseNumber", "displayOrder");
