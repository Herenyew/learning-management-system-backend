import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../../common/errors/index.js';
import { Permissions } from '../../../common/constants/permission.constant.js';
import {
  getSettingDefinition,
  isRegisteredSettingKey,
  isSecretSettingKey,
  KNOWN_SETTINGS,
  validateSettingValue,
} from './known-settings.registry.js';
import { decryptSettingValue, encryptSettingValue, maskSettingValue } from './system-setting-crypto.js';
import { Prisma } from '@prisma/client';
import type { SystemSettingRepository } from './system-setting.repository.js';
import type {
  BulkUpdateItem,
  CreateSystemSettingInput,
  SystemSetting,
  SystemSettingDto,
  SystemSettingFilterParams,
  UpdateSystemSettingInput,
} from './system-setting.types.js';

/** Actor model — super admin is signalled by the system_config.manage permission. */
export type SystemSettingActor = {
  companyId: number;
  appUserId: number;
  permissions: string[];
};

export class SystemSettingService {
  constructor(private repo: SystemSettingRepository) {}

  // ─────────────────────────────────────────────────────────────
  // Creates & updates
  // ─────────────────────────────────────────────────────────────

  async create(actor: SystemSettingActor, data: CreateSystemSettingInput) {
    const { companyId } = actor;
    const key = data.settingKey;
    const isKnown = isRegisteredSettingKey(key);

    // Custom keys are allowed only for Super Admins (Advanced mode).
    if (!isKnown && !this.isSuperAdmin(actor)) {
      throw new ForbiddenError(
        'Custom system settings may only be created by a Super Admin. Use a key from the managed registry.',
      );
    }

    const existing = await this.repo.findByKey(companyId, key);
    if (existing) {
      throw new ConflictError(`A system setting with key "${key}" already exists.`);
    }

    // valueType is required for custom settings; known settings always use
    // the registry's declared type (caller-provided type cannot override it).
    const valueType = isKnown ? getSettingDefinition(key)!.valueType : data.valueType;
    if (!valueType) {
      throw new ValidationError('valueType is required when creating a custom setting.');
    }

    // Validate & normalize the value against the declared type.
    const validated = validateSettingValue(valueType, data.settingValue, { allowNull: true });
    if (!validated.ok) {
      throw new ValidationError(`Invalid value for "${key}".`, validated.error);
    }

    const isSecret = isSecretSettingKey(key);
    const storedValue =
      isSecret && validated.value != null
        ? encryptSettingValue(String(validated.value))
        : validated.value;

    const created = await this.repo.create(companyId, actor.appUserId, {
      category: isKnown ? getSettingDefinition(key)!.category : data.category,
      settingKey: key,
      settingValue: storedValue,
      valueType,
      description: data.description,
      isActive: data.isActive ?? true,
    });

    return this.toDto(created);
  }

  async update(actor: SystemSettingActor, id: number, data: UpdateSystemSettingInput) {
    const existing = await this.repo.findById(actor.companyId, id);
    if (!existing) {
      throw new NotFoundError('System setting');
    }

    const isKnown = isRegisteredSettingKey(existing.settingKey);

    // The effective type comes from the registry (managed keys) or from the
    // stored row (custom keys). Clients cannot silently change a managed key's type.
    const effectiveType = isKnown
      ? getSettingDefinition(existing.settingKey)!.valueType
      : (data.valueType ?? existing.valueType);

    const nextData: UpdateSystemSettingInput = { ...data, valueType: effectiveType };

    if (data.settingValue !== undefined) {
      const validated = validateSettingValue(effectiveType, data.settingValue, { allowNull: true });
      if (!validated.ok) {
        throw new ValidationError(`Invalid value for "${existing.settingKey}".`, validated.error);
      }
      // Secrets are re-encrypted on every write; they are never stored in plain text.
      if (isSecretSettingKey(existing.settingKey) && validated.value != null) {
        nextData.settingValue = encryptSettingValue(String(validated.value));
      } else {
        nextData.settingValue = validated.value;
      }
    }

    // Core managed settings cannot be deactivated.
    if (isKnown && data.isActive === false) {
      throw new ForbiddenError(`Core setting "${existing.settingKey}" cannot be deactivated.`);
    }

    const updated = await this.repo.update(actor.companyId, id, actor.appUserId, nextData);
    return this.toDto(updated);
  }

  async bulkUpdate(actor: SystemSettingActor, items: BulkUpdateItem[]) {
    const { companyId } = actor;

    // Load the company's current rows once for validation + resolution.
    const existing = await this.repo.findMany(companyId, { page: 1, pageSize: 500 });
    const byKey = new Map(existing.items.map((r) => [r.settingKey, r]));
    const resolved: BulkUpdateItem[] = [];

    for (const item of items) {
      let row: SystemSetting | undefined;
      if (item.id != null) {
        row = existing.items.find((r) => r.id === item.id);
      } else if (item.settingKey) {
        row = byKey.get(item.settingKey);
      }

      if (!row) {
        // Upsert path for not-yet-seeded values — must be a managed key.
        if (item.settingKey && isRegisteredSettingKey(item.settingKey)) {
          const def = getSettingDefinition(item.settingKey)!;
          const validated = validateSettingValue(def.valueType, item.settingValue, { allowNull: true });
          if (!validated.ok) {
            throw new ValidationError(`Invalid value for "${item.settingKey}".`, validated.error);
          }
          const storedValue =
            isSecretSettingKey(item.settingKey) && validated.value != null
              ? encryptSettingValue(String(validated.value))
              : validated.value;
          resolved.push({ settingKey: item.settingKey, settingValue: storedValue, isActive: true });
          continue;
        }
        throw new NotFoundError(
          `System setting ${item.id != null ? `#${item.id}` : `"${item.settingKey}"`}`,
        );
      }

      // Registered managed settings cannot be deactivated.
      if (isRegisteredSettingKey(row.settingKey) && item.isActive === false) {
        throw new ForbiddenError(`Core setting "${row.settingKey}" cannot be deactivated.`);
      }

      const effectiveType = isRegisteredSettingKey(row.settingKey)
        ? getSettingDefinition(row.settingKey)!.valueType
        : row.valueType;

      if (item.settingValue !== undefined) {
        const validated = validateSettingValue(effectiveType, item.settingValue, { allowNull: true });
        if (!validated.ok) {
          throw new ValidationError(`Invalid value for "${row.settingKey}".`, validated.error);
        }
        const storedValue =
          isSecretSettingKey(row.settingKey) && validated.value != null
            ? encryptSettingValue(String(validated.value))
            : validated.value;
        resolved.push({ id: row.id, settingValue: storedValue, isActive: item.isActive });
      } else {
        resolved.push({ id: row.id, ...(item.isActive !== undefined && { isActive: item.isActive }) });
      }
    }

    const updated = await this.repo.bulkUpdate(companyId, actor.appUserId, resolved);
    return updated.map((r) => this.toDto(r));
  }
// ─────────────────────────────────────────────────────────────
  // Reads
  // ─────────────────────────────────────────────────────────────

  async findById(companyId: number, id: number) {
    const row = await this.repo.findById(companyId, id);
    return row ? this.toDto(row) : null;
  }

  async findByKey(companyId: number, key: string) {
    const row = await this.repo.findByKey(companyId, key);
    return row ? this.toDto(row) : null;
  }

  async findMany(companyId: number, query: SystemSettingFilterParams) {
    const result = await this.repo.findMany(companyId, query);
    const merged = this.mergeWithDefaults(companyId, result.items);
    return {
      items: merged.map((r) => this.toDto(r)),
      total: Math.max(result.total, merged.length),
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  /** Active settings per category, with registry defaults filled in. */
  async listActiveByCategory(companyId: number, category: SystemSettingDto['category']) {
    const result = await this.repo.findMany(companyId, { category, isActive: true, page: 1, pageSize: 300 });
    return this.mergeWithDefaults(companyId, result.items).map((r) => this.toDto(r));
  }

  async delete(actor: SystemSettingActor, id: number) {
    const existing = await this.repo.findById(actor.companyId, id);
    if (!existing) {
      throw new NotFoundError('System setting');
    }
    // Core managed settings cannot be deleted.
    if (isRegisteredSettingKey(existing.settingKey)) {
      throw new ForbiddenError(`Core setting "${existing.settingKey}" cannot be deleted.`);
    }
    await this.repo.delete(actor.companyId, id);
    return { id };
  }

  // ─────────────────────────────────────────────────────────────
  // Defaults & seeding
  // ─────────────────────────────────────────────────────────────

  /**
   * Every company receives the full Known Settings Registry. This can be
   * called during seed and/or lazily so the managed UI always has rows.
   */
  async seedDefaultsForCompany(companyId: number, actorId: number): Promise<number> {
    const existing = await this.repo.findMany(companyId, { page: 1, pageSize: 500 });
    const existingKeys = new Set(existing.items.map((r) => r.settingKey));

    const toCreate: CreateSystemSettingInput[] = KNOWN_SETTINGS.filter(
      (def) => !existingKeys.has(def.key),
    ).map((def) => ({
      category: def.category,
      settingKey: def.key,
      settingValue: isSecretSettingKey(def.key) && def.defaultValue != null
        ? encryptSettingValue(String(def.defaultValue))
        : def.defaultValue,
      valueType: def.valueType,
      description: def.description,
      isActive: true,
    }));

    let created = 0;
    for (const data of toCreate) {
      await this.repo.create(companyId, actorId, data);
      created += 1;
    }

    return created;
  }

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────

  private isSuperAdmin(actor: SystemSettingActor): boolean {
    return actor.permissions.includes(Permissions.SYSTEM_CONFIG_MANAGE);
  }

  /**
   * Merge rows with registry defaults so the UI always shows the complete
   * known set even before seeding has run for a brand-new company.
   */
  private mergeWithDefaults(companyId: number, rows: SystemSetting[]): SystemSetting[] {
    const byKey = new Map(rows.map((r) => [r.settingKey, r]));
    const merged: SystemSetting[] = [...rows];

    for (const def of KNOWN_SETTINGS) {
      if (!byKey.has(def.key)) {
        merged.push({
          id: 0,
          companyId,
          category: def.category,
          settingKey: def.key,
          settingValue: (def.defaultValue ?? null) as Prisma.JsonValue,
          valueType: def.valueType,
          description: def.description ?? null,
          isActive: true,
          createdBy: null,
          updatedBy: 0,
          createdAt: new Date(0),
          updatedAt: new Date(0),
        });
      }
    }
    // Stable sort by key so the UI is deterministic.
    return merged.sort((a, b) => a.settingKey.localeCompare(b.settingKey));
  }

  /** Maps a DB row to the API shape. Secrets are masked, never decrypted for clients. */
  private toDto(row: SystemSetting): SystemSettingDto {
    let value = row.settingValue;
    if (isSecretSettingKey(row.settingKey) && typeof value === "string") {
      value = maskSettingValue(value);
    }
    return {
      id: row.id,
      companyId: row.companyId,
      category: row.category,
      settingKey: row.settingKey,
      settingValue: value,
      valueType: row.valueType,
      description: row.description ?? null,
      isActive: row.isActive,
      createdBy: row.createdBy,
      updatedBy: row.updatedBy,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  /** Server-side read helper used by other modules (decrypted values). */
  async getValue<T = unknown>(companyId: number, key: string): Promise<T | null> {
    const row = await this.repo.findByKey(companyId, key);
    if (!row || !row.isActive) return null;
    let value = row.settingValue;
    if (isSecretSettingKey(key) && typeof value === "string") {
      try {
        value = decryptSettingValue(value);
      } catch {
        return null;
      }
    }
    return value as T;
  }

  /**
   * Live branding palette for the authenticated company. Available to any
   * authenticated user (no special permission) so every client can apply the
   * company theme on startup.
   */
  async getBranding(companyId: number) {
    const [primaryColor, secondaryColor, accentColor, defaultTheme] = await Promise.all([
      this.getValue<string>(companyId, "primary_color"),
      this.getValue<string>(companyId, "secondary_color"),
      this.getValue<string>(companyId, "accent_color"),
      this.getValue<string>(companyId, "default_theme"),
    ]);

    // Fall back to the known-settings registry defaults when unset.
    const fallback = (key: string) =>
      KNOWN_SETTINGS.find((s) => s.key === key)?.defaultValue;

    return {
      primaryColor: primaryColor ?? (fallback("primary_color") as string),
      secondaryColor: secondaryColor ?? (fallback("secondary_color") as string),
      accentColor: accentColor ?? (fallback("accent_color") as string),
      defaultTheme: defaultTheme ?? (fallback("default_theme") as string),
    };
  }
}