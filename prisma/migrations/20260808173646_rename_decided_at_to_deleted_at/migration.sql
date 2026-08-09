/*
  Warnings:

  - You are about to drop the column `decidedAt` on the `content_file_type` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "content_file_type" DROP COLUMN "decidedAt",
ADD COLUMN     "deletedAt" TIMESTAMP(3);
