-- Dynamic Question Builder: configJson on question types + template question rows
ALTER TABLE "survey_question_types" ADD COLUMN "configJson" JSONB;

CREATE TABLE "survey_template_questions" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "templateId" INTEGER NOT NULL,
    "questionTypeId" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "configJson" JSONB,
    "displayOrder" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "survey_template_questions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "survey_template_questions_companyId_idx" ON "survey_template_questions"("companyId");
CREATE INDEX "survey_template_questions_templateId_idx" ON "survey_template_questions"("templateId");
CREATE UNIQUE INDEX "survey_template_questions_templateId_displayOrder_key" ON "survey_template_questions"("templateId", "displayOrder");

ALTER TABLE "survey_template_questions" ADD CONSTRAINT "survey_template_questions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "survey_template_questions" ADD CONSTRAINT "survey_template_questions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "survey_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "survey_template_questions" ADD CONSTRAINT "survey_template_questions_questionTypeId_fkey" FOREIGN KEY ("questionTypeId") REFERENCES "survey_question_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
