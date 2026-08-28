import "dotenv/config";
import { updateCourseTemplateSchema } from "./src/modules/configuration/course-configuration/course-configuration.dto.js";
import { CourseConfigurationRepository } from "./src/modules/configuration/course-configuration/course-configuration.repository.js";
import { CourseConfigurationService } from "./src/modules/configuration/course-configuration/course-configuration.service.js";
import { PrismaClient } from "@prisma/client";

const payload = {
  name: "Onboarding Bootcamp Template",
  description: "Template for standard company tech onboarding",
  shortSummary: undefined,
  categoryId: 1,
  difficultyLevelId: 1,
  passingScore: 70,
  completionThreshold: 90,
  isActive: true,
};

console.log("=== parse (number payload, as frontend sends) ===");
const r1 = updateCourseTemplateSchema.safeParse(payload);
console.log("success:", r1.success);
if (!r1.success) console.log("ISSUES:", JSON.stringify(r1.error.issues, null, 2));

console.log("\n=== parse (STRING passingScore/completionThreshold) ===");
const r2 = updateCourseTemplateSchema.safeParse({ ...payload, passingScore: "70", completionThreshold: "90" });
console.log("success:", r2.success);
if (!r2.success) console.log("ISSUES:", JSON.stringify(r2.error.issues, null, 2));

const prisma = new PrismaClient();
const repo = new CourseConfigurationRepository(prisma);
const svc = new CourseConfigurationService(repo);

console.log("\n=== current template #4 ===");
const before = await repo.findTemplateById(4, 1);
console.log(JSON.stringify({
  id: before?.id, name: before?.name, passingScore: before ? String(before.passingScore) : null,
  completionThreshold: before ? String(before.completionThreshold) : null,
  createdAt: before?.createdAt, updatedAt: before?.updatedAt,
}, null, 2));

console.log("\n=== service.updateTemplate(4, 1, dto) ===");
try {
  const res: any = await svc.updateTemplate(4, 1, r1.success ? r1.data : payload);
  console.log("OK -> id:", res.id, "name:", res.name,
    "passingScore:", String(res.passingScore),
    "completionThreshold:", String(res.completionThreshold),
    "categoryId:", res.categoryId, "difficultyLevelId:", res.difficultyLevelId,
    "createdAt:", res.createdAt, "updatedAt:", res.updatedAt);
} catch (e) {
  console.log("ERR", e?.constructor?.name, e?.message);
  console.log(e?.stack || e);
}

await prisma.$disconnect();
