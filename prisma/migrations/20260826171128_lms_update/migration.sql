-- AlterTable
ALTER TABLE "assessment_templates" ADD COLUMN     "questionCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "notification_templates" ADD COLUMN     "replyToEmail" VARCHAR(255),
ADD COLUMN     "senderName" VARCHAR(255);
