-- ============================================================
-- System Settings — managed, type-safe, company-scoped
--
--  • Align native enum type names with Prisma @@map:
--      "SettingCategory"  → "setting_categories"
--      "SettingDataType"  → "setting_value_types"
--  • Add valueType, isActive, createdBy to system_settings.
--  • Composite index (companyId, category, isActive).
-- ============================================================

-- Rename enum types (dependent columns follow automatically).
ALTER TYPE "SettingCategory" RENAME TO "setting_categories";
ALTER TYPE "SettingDataType" RENAME TO "setting_value_types";

-- Add managed-settings columns.
ALTER TABLE "system_settings"
  ADD COLUMN "valueType" "setting_value_types" NOT NULL DEFAULT 'STRING',
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "createdBy" INTEGER;

-- Backfill valueType from the existing JSON payload so every row
-- becomes type-safe (best effort: infer from the stored JSON shape).
UPDATE "system_settings"
SET "valueType" = CASE
  WHEN jsonb_typeof("settingValue") = 'boolean' THEN 'BOOLEAN'::"setting_value_types"
  WHEN jsonb_typeof("settingValue") = 'number'  THEN 'NUMBER'::"setting_value_types"
  WHEN jsonb_typeof("settingValue") IN ('array', 'object') THEN 'JSON'::"setting_value_types"
  ELSE 'STRING'::"setting_value_types"
END;

-- createdBy is optional (legacy rows were created without an actor).
ALTER TABLE "system_settings"
  ADD CONSTRAINT "system_settings_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "app_user"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Composite index used by the managed settings query path.
CREATE INDEX "system_settings_companyId_category_isActive_idx"
  ON "system_settings"("companyId", "category", "isActive");