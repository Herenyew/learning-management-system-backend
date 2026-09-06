-- CreateEnum
CREATE TYPE "CourseCompletionMethod" AS ENUM ('VIEW_ALL_CONTENT', 'COMPLETE_QUIZ', 'HYBRID');

-- AlterTable (course_templates)
ALTER TABLE "course_templates" ADD COLUMN "ownerId" INTEGER NOT NULL;
ALTER TABLE "course_templates" ADD COLUMN "responsiblePersonId" INTEGER NOT NULL;
ALTER TABLE "course_templates" ADD COLUMN "completionMethod" "CourseCompletionMethod" NOT NULL DEFAULT 'HYBRID';
ALTER TABLE "course_templates" ADD COLUMN "minTimeSpentMinutes" INTEGER;
ALTER TABLE "course_templates" ADD COLUMN "defaultChapters" JSONB;

-- AlterTable (program_templates)
ALTER TABLE "program_templates" ADD COLUMN "ownerEmployeeId" VARCHAR(20) NOT NULL;
ALTER TABLE "program_templates" ADD COLUMN "defaultCourses" JSONB;
ALTER TABLE "program_templates" ADD COLUMN "defaultTasks" JSONB;

-- AlterTable (assessment_templates)
ALTER TABLE "assessment_templates" ADD COLUMN "questionBankId" INTEGER;
ALTER TABLE "assessment_templates" ADD COLUMN "tabSwitchDetection" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable (certificate_templates)
ALTER TABLE "certificate_templates" ADD COLUMN "titleText" VARCHAR(255);
ALTER TABLE "certificate_templates" ADD COLUMN "credentialText" TEXT;

-- CreateIndex
CREATE INDEX "course_templates_ownerId_idx" ON "course_templates"("ownerId");
CREATE INDEX "course_templates_responsiblePersonId_idx" ON "course_templates"("responsiblePersonId");
CREATE INDEX "program_templates_ownerEmployeeId_idx" ON "program_templates"("ownerEmployeeId");
CREATE INDEX "assessment_templates_questionBankId_idx" ON "assessment_templates"("questionBankId");

-- AddForeignKey
ALTER TABLE "course_templates" ADD CONSTRAINT "course_templates_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "course_templates" ADD CONSTRAINT "course_templates_responsiblePersonId_fkey" FOREIGN KEY ("responsiblePersonId") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "program_templates" ADD CONSTRAINT "program_templates_ownerEmployeeId_fkey" FOREIGN KEY ("ownerEmployeeId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "assessment_templates" ADD CONSTRAINT "assessment_templates_questionBankId_fkey" FOREIGN KEY ("questionBankId") REFERENCES "question_banks"("id") ON DELETE SET NULL ON UPDATE CASCADE;