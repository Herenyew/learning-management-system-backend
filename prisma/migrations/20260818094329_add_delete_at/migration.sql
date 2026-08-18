-- CreateEnum
CREATE TYPE "CustomFieldTarget" AS ENUM ('COURSE', 'PROGRAM', 'TNA_REQUEST', 'ENROLLMENT', 'CERTIFICATE', 'USER_PROFILE', 'CONTENT');

-- CreateEnum
CREATE TYPE "CustomFieldType" AS ENUM ('TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'BOOLEAN', 'SINGLE_SELECT', 'MULTI_SELECT', 'URL');

-- AlterTable
ALTER TABLE "learning_levels" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "custom_field_definitions" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "target" "CustomFieldTarget" NOT NULL,
    "fieldKey" VARCHAR(100) NOT NULL,
    "label" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "fieldType" "CustomFieldType" NOT NULL,
    "settingsJson" JSONB NOT NULL DEFAULT '{}',
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdBy" INTEGER NOT NULL,
    "updatedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "custom_field_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "custom_field_definitions_companyId_idx" ON "custom_field_definitions"("companyId");

-- CreateIndex
CREATE INDEX "custom_field_definitions_companyId_target_isActive_displayO_idx" ON "custom_field_definitions"("companyId", "target", "isActive", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "custom_field_definitions_companyId_target_fieldKey_key" ON "custom_field_definitions"("companyId", "target", "fieldKey");

-- AddForeignKey
ALTER TABLE "custom_field_definitions" ADD CONSTRAINT "custom_field_definitions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_field_definitions" ADD CONSTRAINT "custom_field_definitions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_field_definitions" ADD CONSTRAINT "custom_field_definitions_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
