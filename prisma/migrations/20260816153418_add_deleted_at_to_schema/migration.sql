-- AlterTable
ALTER TABLE "enrollment_rule_types" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "program_types" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "task_types" ADD COLUMN     "deletedAt" TIMESTAMP(3);
