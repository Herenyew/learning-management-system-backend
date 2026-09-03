// ============================================================
// Seed System Settings (managed, company-scoped)
//
// Ensures every company has the full Known Settings Registry.
// Idempotent — existing rows are preserved.
//
// Run: npx ts-node prisma/seed-system-settings.ts
// ============================================================
import { PrismaClient } from "@prisma/client";
import {
  KNOWN_SETTINGS,
  isSecretSettingKey,
} from "../src/modules/configuration/system-settings/known-settings.registry.js";
import { encryptSettingValue } from "../src/modules/configuration/system-settings/system-setting-crypto.js";

const prisma = new PrismaClient();

async function seedSystemSettingsForCompany(companyId: number): Promise<number> {
  const existing = await prisma.systemSetting.findMany({
    where: { companyId },
    select: { settingKey: true },
  });
  const existingKeys = new Set(existing.map((r) => r.settingKey));

  // Actor for createdBy/updatedBy — prefers the first active admin, falls
  // back to any active user of the company.
  const actor =
    (await prisma.appUser.findFirst({
      where: { companyId, isActive: true },
      select: { id: true },
      orderBy: { id: "asc" },
    })) ?? null;
  const actorId = actor?.id ?? 1;

  let created = 0;
  for (const def of KNOWN_SETTINGS) {
    if (existingKeys.has(def.key)) continue;

    await prisma.systemSetting.create({
      data: {
        companyId,
        category: def.category,
        settingKey: def.key,
        settingValue:
          isSecretSettingKey(def.key) && def.defaultValue != null
            ? encryptSettingValue(String(def.defaultValue))
            : ((def.defaultValue ?? null) as object),
        valueType: def.valueType,
        description: def.description,
        isActive: true,
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
    created += 1;
  }

  return created;
}

async function main() {
  const companies = await prisma.company.findMany({ select: { id: true } });
  console.log(`Seeding system settings for ${companies.length} compan${companies.length === 1 ? "y" : "ies"}...`);

  let total = 0;
  for (const company of companies) {
    const created = await seedSystemSettingsForCompany(company.id);
    total += created;
    console.log(`  company ${company.id}: ${created} settings seeded`);
  }

  console.log(`Done — ${total} system settings created.`);
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });