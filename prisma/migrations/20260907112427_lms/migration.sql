-- CreateEnum
CREATE TYPE "notification_area" AS ENUM ('course', 'program', 'assignment', 'tna', 'certificate', 'certificate_expiry');

-- DropIndex
DROP INDEX "course_templates_ownerId_idx";

-- DropIndex
DROP INDEX "course_templates_responsiblePersonId_idx";

-- AlterTable
ALTER TABLE "app_role" ADD COLUMN     "lms_policy_initialized_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "app_user" ADD COLUMN     "ems_roles" JSONB,
ADD COLUMN     "primary_em_role_id" INTEGER;

-- AlterTable
ALTER TABLE "lms_permissions" ADD COLUMN     "group_id" INTEGER;

-- CreateTable
CREATE TABLE "permission_groups" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "module" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permission_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role_assignments" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "app_role_id" INTEGER NOT NULL,
    "assigned_by" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_manual" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "user_role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ems_role_mappings" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "ems_role_name" VARCHAR(100) NOT NULL,
    "app_role_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "auto_assign" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ems_role_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_auth_credentials" (
    "app_user_id" INTEGER NOT NULL,
    "normalized_email" VARCHAR(150) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "password_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lms_auth_credentials_pkey" PRIMARY KEY ("app_user_id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "company_id" INTEGER,
    "actor_user_id" INTEGER,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "action" TEXT NOT NULL,
    "before_json" JSONB,
    "after_json" JSONB,
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_settings" (
    "id" UUID NOT NULL,
    "company_id" INTEGER NOT NULL,
    "app_user_id" INTEGER NOT NULL,
    "channel" VARCHAR(50) NOT NULL,
    "notification_type" VARCHAR(100) NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_notification_settings" (
    "company_id" INTEGER NOT NULL,
    "area" "notification_area" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_notification_settings_pkey" PRIMARY KEY ("company_id","area","channel")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "company_id" INTEGER NOT NULL,
    "app_user_id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT,
    "notification_type" VARCHAR(100) NOT NULL,
    "event_code" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(100),
    "entity_id" VARCHAR(100),
    "occurrence_key" VARCHAR(255),
    "in_app_visible" BOOLEAN NOT NULL DEFAULT true,
    "action_url" VARCHAR(500),
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "permission_groups_company_id_idx" ON "permission_groups"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "permission_groups_company_id_name_key" ON "permission_groups"("company_id", "name");

-- CreateIndex
CREATE INDEX "user_role_assignments_company_id_idx" ON "user_role_assignments"("company_id");

-- CreateIndex
CREATE INDEX "user_role_assignments_user_id_is_active_idx" ON "user_role_assignments"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "user_role_assignments_app_role_id_idx" ON "user_role_assignments"("app_role_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_role_assignments_user_id_app_role_id_key" ON "user_role_assignments"("user_id", "app_role_id");

-- CreateIndex
CREATE INDEX "ems_role_mappings_company_id_idx" ON "ems_role_mappings"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "ems_role_mappings_company_id_ems_role_name_key" ON "ems_role_mappings"("company_id", "ems_role_name");

-- CreateIndex
CREATE UNIQUE INDEX "lms_auth_credentials_normalized_email_key" ON "lms_auth_credentials"("normalized_email");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_company_id_idx" ON "audit_logs"("company_id");

-- CreateIndex
CREATE INDEX "notification_settings_company_id_idx" ON "notification_settings"("company_id");

-- CreateIndex
CREATE INDEX "notification_settings_app_user_id_idx" ON "notification_settings"("app_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_settings_app_user_id_channel_notification_type_key" ON "notification_settings"("app_user_id", "channel", "notification_type");

-- CreateIndex
CREATE INDEX "company_notification_settings_company_id_idx" ON "company_notification_settings"("company_id");

-- CreateIndex
CREATE INDEX "notifications_app_user_id_created_at_idx" ON "notifications"("app_user_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_inbox_idx" ON "notifications"("company_id", "app_user_id", "read_at", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_occurrence_key" ON "notifications"("company_id", "app_user_id", "event_code", "entity_type", "entity_id", "occurrence_key");

-- CreateIndex
CREATE INDEX "app_user_primary_em_role_id_idx" ON "app_user"("primary_em_role_id");

-- CreateIndex
CREATE INDEX "lms_permissions_group_id_idx" ON "lms_permissions"("group_id");

-- AddForeignKey
ALTER TABLE "app_user" ADD CONSTRAINT "app_user_primary_em_role_id_fkey" FOREIGN KEY ("primary_em_role_id") REFERENCES "app_role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission_groups" ADD CONSTRAINT "permission_groups_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_app_role_id_fkey" FOREIGN KEY ("app_role_id") REFERENCES "app_role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_role_mappings" ADD CONSTRAINT "ems_role_mappings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_role_mappings" ADD CONSTRAINT "ems_role_mappings_app_role_id_fkey" FOREIGN KEY ("app_role_id") REFERENCES "app_role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_permissions" ADD CONSTRAINT "lms_permissions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "permission_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_auth_credentials" ADD CONSTRAINT "lms_auth_credentials_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_notification_settings" ADD CONSTRAINT "company_notification_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
