/*
  Warnings:

  - You are about to drop the `ContentFileType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ContentType` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "course_contents" DROP CONSTRAINT "course_contents_contentTypeId_fkey";

-- DropForeignKey
ALTER TABLE "stored_files" DROP CONSTRAINT "stored_files_fileTypeId_fkey";

-- AlterTable
ALTER TABLE "difficulty_levels" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "ContentFileType";

-- DropTable
DROP TABLE "ContentType";

-- CreateTable
CREATE TABLE "content_type" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ContentCategory" NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "content_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_file_type" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "content_file_type_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "content_type_slug_key" ON "content_type"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "content_file_type_slug_key" ON "content_file_type"("slug");

-- AddForeignKey
ALTER TABLE "stored_files" ADD CONSTRAINT "stored_files_fileTypeId_fkey" FOREIGN KEY ("fileTypeId") REFERENCES "content_file_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_contents" ADD CONSTRAINT "course_contents_contentTypeId_fkey" FOREIGN KEY ("contentTypeId") REFERENCES "content_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
