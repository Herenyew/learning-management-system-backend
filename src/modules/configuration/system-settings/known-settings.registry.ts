// ============================================================
// Known Settings Registry
//
// The single source of truth for every system setting a company
// may configure through the managed System Settings UI.
//
// Rules enforced by the service layer:
//   • Only keys in this registry are allowed by default.
//   • Free-text / custom key creation is Super Admin only.
//   • valueType is respected — every stored value is validated
//     against its registered type before persistence.
//   • Secret registrations are encrypted at rest and never
//     returned to clients in plain text.
// ============================================================

import { SettingCategory, SettingValueType } from "@prisma/client";

export type KnownSettingDefinition = {
  /** Unique, kebab/dot-case key (matches ^[a-z][a-z0-9_.-]{1,149}$). */
  key: string;
  category: SettingCategory;
  valueType: SettingValueType;
  /** Default applied when the setting is seeded for a company. */
  defaultValue: unknown | null;
  /** Human label used by the managed UI. */
  label: string;
  description?: string;
  /** Select/multi-select options for enum-style STRING / JSON settings. */
  options?: { value: string; label: string }[];
  /** True for credentials/keys — encrypted at rest, masked on read. */
  secret?: boolean;
  /** True for live branding settings that apply immediately after save. */
  live?: boolean;
};

export const KNOWN_SETTINGS: KnownSettingDefinition[] = [
  // ────────────────────────────────────────────── GENERAL ──
  { key: "platform_name", category: SettingCategory.GENERAL, valueType: SettingValueType.STRING, defaultValue: "LearnOS", label: "Platform Name", description: "Shown in the sidebar and page titles.", live: true },
  { key: "platform_logo_url", category: SettingCategory.GENERAL, valueType: SettingValueType.STRING, defaultValue: null, label: "Platform Logo URL", description: "Logo shown in the sidebar header.", live: true },
  { key: "default_theme", category: SettingCategory.GENERAL, valueType: SettingValueType.STRING, defaultValue: "light", label: "Default Theme", description: "Light, dark, or custom theme for the workspace.", live: true, options: [{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }, { value: "custom", label: "Custom" }] },
  { key: "custom_theme_colors", category: SettingCategory.GENERAL, valueType: SettingValueType.STRING, defaultValue: null, label: "Custom Theme Colors", description: "JSON object with custom color values (background, foreground, card, primary, secondary, muted, accent, border, sidebar).", live: true },
  { key: "primary_color", category: SettingCategory.GENERAL, valueType: SettingValueType.STRING, defaultValue: "#3B82F6", label: "Primary Color", description: "Primary brand color used across the UI.", live: true },
  { key: "secondary_color", category: SettingCategory.GENERAL, valueType: SettingValueType.STRING, defaultValue: "#64748B", label: "Secondary Color", description: "Secondary brand color.", live: true },
  { key: "accent_color", category: SettingCategory.GENERAL, valueType: SettingValueType.STRING, defaultValue: "#10B981", label: "Accent Color", description: "Accent color for highlights and focus states.", live: true },
  { key: "default_language", category: SettingCategory.GENERAL, valueType: SettingValueType.STRING, defaultValue: "en", label: "Default Language", options: [{ value: "en", label: "English" }, { value: "am", label: "Amharic" }, { value: "fr", label: "French" }, { value: "ar", label: "Arabic" }, { value: "sw", label: "Swahili" }] },
  { key: "default_timezone", category: SettingCategory.GENERAL, valueType: SettingValueType.STRING, defaultValue: "Africa/Addis_Ababa", label: "Default Timezone", options: [{ value: "Africa/Addis_Ababa", label: "Africa/Addis_Ababa (EAT)" }, { value: "Africa/Nairobi", label: "Africa/Nairobi (EAT)" }, { value: "Africa/Cairo", label: "Africa/Cairo (EET)" }, { value: "Africa/Lagos", label: "Africa/Lagos (WAT)" }, { value: "UTC", label: "UTC" }] },
  { key: "default_date_format", category: SettingCategory.GENERAL, valueType: SettingValueType.STRING, defaultValue: "DD/MM/YYYY", label: "Default Date Format", options: [{ value: "DD/MM/YYYY", label: "DD/MM/YYYY" }, { value: "MM/DD/YYYY", label: "MM/DD/YYYY" }, { value: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO)" }] },
  { key: "maintenance_mode", category: SettingCategory.GENERAL, valueType: SettingValueType.BOOLEAN, defaultValue: false, label: "Maintenance Mode", description: "Puts the platform into read-only maintenance.", live: true },
  { key: "enabled_content_types", category: SettingCategory.GENERAL, valueType: SettingValueType.JSON, defaultValue: ["document", "video", "quiz", "link", "scorm", "live_session", "assignment", "survey"], label: "Enabled Content Types", description: "Content types creators may attach to courses.", options: [
    { value: "document", label: "Document" }, { value: "video", label: "Video" }, { value: "quiz", label: "Quiz" }, { value: "link", label: "Link" }, { value: "scorm", label: "SCORM" }, { value: "live_session", label: "Live Session" }, { value: "assignment", label: "Assignment" }, { value: "survey", label: "Survey" },
  ] },

  // ────────────────────────────────────────────── ENROLLMENT ──
  { key: "default_enrollment_policy", category: SettingCategory.ENROLLMENT, valueType: SettingValueType.STRING, defaultValue: "open", label: "Default Enrollment Policy", options: [{ value: "open", label: "Open" }, { value: "invitation_only", label: "Invitation Only" }, { value: "payment_required", label: "Payment Required" }] },
  { key: "default_visibility", category: SettingCategory.ENROLLMENT, valueType: SettingValueType.STRING, defaultValue: "signed_in", label: "Default Visibility", options: [{ value: "public", label: "Public" }, { value: "signed_in", label: "Signed In" }, { value: "company", label: "Company Only" }, { value: "enrolled_only", label: "Enrolled Only" }] },
  { key: "default_course_capacity", category: SettingCategory.ENROLLMENT, valueType: SettingValueType.NUMBER, defaultValue: 0, label: "Default Course Capacity", description: "0 = unlimited." },
  { key: "default_program_capacity", category: SettingCategory.ENROLLMENT, valueType: SettingValueType.NUMBER, defaultValue: 0, label: "Default Program Capacity", description: "0 = unlimited." },
  { key: "default_waitlist_size", category: SettingCategory.ENROLLMENT, valueType: SettingValueType.NUMBER, defaultValue: 20, label: "Default Waitlist Size" },
  { key: "default_waitlist_response_hours", category: SettingCategory.ENROLLMENT, valueType: SettingValueType.NUMBER, defaultValue: 48, label: "Waitlist Response Window (hours)" },

  // ────────────────────────────────────────────── NOTIFICATIONS ──
  { key: "default_email_enabled", category: SettingCategory.NOTIFICATIONS, valueType: SettingValueType.BOOLEAN, defaultValue: true, label: "Email Notifications Enabled" },
  { key: "default_in_app_enabled", category: SettingCategory.NOTIFICATIONS, valueType: SettingValueType.BOOLEAN, defaultValue: true, label: "In-App Notifications Enabled" },
  { key: "notification_sender_name", category: SettingCategory.NOTIFICATIONS, valueType: SettingValueType.STRING, defaultValue: "LearnOS", label: "Notification Sender Name" },
  { key: "default_reminder_days_before", category: SettingCategory.NOTIFICATIONS, valueType: SettingValueType.NUMBER, defaultValue: 3, label: "Reminder Days Before" },

  // ────────────────────────────────────────────── CERTIFICATION ──
  { key: "default_certificate_validity_days", category: SettingCategory.CERTIFICATION, valueType: SettingValueType.NUMBER, defaultValue: 730, label: "Certificate Validity (days)" },
  { key: "auto_issue_on_completion", category: SettingCategory.CERTIFICATION, valueType: SettingValueType.BOOLEAN, defaultValue: true, label: "Auto-Issue on Completion" },
  { key: "default_certificate_template_id", category: SettingCategory.CERTIFICATION, valueType: SettingValueType.NUMBER, defaultValue: null, label: "Default Certificate Template ID", description: "Leave empty to use the standard template." },

  // ────────────────────────────────────────────── GAMIFICATION ──
  { key: "xp_enabled", category: SettingCategory.GAMIFICATION, valueType: SettingValueType.BOOLEAN, defaultValue: true, label: "XP Enabled" },
  { key: "fallback_course_xp", category: SettingCategory.GAMIFICATION, valueType: SettingValueType.NUMBER, defaultValue: 100, label: "Fallback Course XP" },
  { key: "fallback_assessment_xp", category: SettingCategory.GAMIFICATION, valueType: SettingValueType.NUMBER, defaultValue: 50, label: "Fallback Assessment XP" },
  { key: "fallback_perfect_score_bonus", category: SettingCategory.GAMIFICATION, valueType: SettingValueType.NUMBER, defaultValue: 25, label: "Perfect Score Bonus XP" },

  // ────────────────────────────────────────────── SECURITY ──
  { key: "password_min_length", category: SettingCategory.SECURITY, valueType: SettingValueType.NUMBER, defaultValue: 8, label: "Minimum Password Length" },
  { key: "password_require_uppercase", category: SettingCategory.SECURITY, valueType: SettingValueType.BOOLEAN, defaultValue: true, label: "Require Uppercase" },
  { key: "password_require_lowercase", category: SettingCategory.SECURITY, valueType: SettingValueType.BOOLEAN, defaultValue: true, label: "Require Lowercase" },
  { key: "password_require_number", category: SettingCategory.SECURITY, valueType: SettingValueType.BOOLEAN, defaultValue: true, label: "Require Number" },
  { key: "password_require_special_character", category: SettingCategory.SECURITY, valueType: SettingValueType.BOOLEAN, defaultValue: false, label: "Require Special Character" },
  { key: "mfa_required", category: SettingCategory.SECURITY, valueType: SettingValueType.BOOLEAN, defaultValue: false, label: "Require MFA" },
  { key: "session_timeout_minutes", category: SettingCategory.SECURITY, valueType: SettingValueType.NUMBER, defaultValue: 60, label: "Session Timeout (minutes)" },
  { key: "max_login_attempts", category: SettingCategory.SECURITY, valueType: SettingValueType.NUMBER, defaultValue: 5, label: "Max Login Attempts" },

  // ────────────────────────────────────────────── INTEGRATIONS ──
  { key: "api_rate_limit_per_minute", category: SettingCategory.INTEGRATIONS, valueType: SettingValueType.NUMBER, defaultValue: 60, label: "API Rate Limit (per minute)" },
  { key: "webhook_retry_limit", category: SettingCategory.INTEGRATIONS, valueType: SettingValueType.NUMBER, defaultValue: 3, label: "Webhook Retry Limit" },
  { key: "scorm_default_completion_threshold", category: SettingCategory.INTEGRATIONS, valueType: SettingValueType.NUMBER, defaultValue: 80, label: "SCORM Completion Threshold (%)" },
  { key: "external_cert_sync_enabled", category: SettingCategory.INTEGRATIONS, valueType: SettingValueType.BOOLEAN, defaultValue: false, label: "External Certificate Sync" },
  { key: "calendar_sync_enabled", category: SettingCategory.INTEGRATIONS, valueType: SettingValueType.BOOLEAN, defaultValue: true, label: "Calendar Sync" },
];

// ─────────────────────────────────────────────────────────────
// Fast lookups & metadata
// ─────────────────────────────────────────────────────────────

export const KNOWN_SETTINGS_BY_KEY = new Map<string, KnownSettingDefinition>(
  KNOWN_SETTINGS.map((s) => [s.key, s]),
);

export const KNOWN_SETTING_KEYS = KNOWN_SETTINGS.map((s) => s.key);

export const COLOR_SETTING_KEYS = new Set(["primary_color", "secondary_color", "accent_color"]);

/** Settings that apply instantly to the app shell after save. */
export const LIVE_BRANDING_KEYS = new Set([
  "platform_name",
  "platform_logo_url",
  "default_theme",
  "primary_color",
  "secondary_color",
  "accent_color",
  "maintenance_mode",
]);

export const SECRET_SETTING_KEYS = new Set<string>();

/** Sensitive custom keys are treated as secrets (encrypted at rest, masked on read). */
export const SECRET_KEY_NAME_REGEX = /(secret|token|api[_-]?key|password|credential|private[_-]?key)/i;

export const SETTING_KEY_REGEX = /^[a-z][a-z0-9_.-]{1,149}$/;

export function isRegisteredSettingKey(key: string): boolean {
  return KNOWN_SETTINGS_BY_KEY.has(key);
}

export function getSettingDefinition(key: string): KnownSettingDefinition | undefined {
  return KNOWN_SETTINGS_BY_KEY.get(key);
}

export function isSecretSettingKey(key: string): boolean {
  return SECRET_SETTING_KEYS.has(key) || SECRET_KEY_NAME_REGEX.test(key);
}

export function isColorSettingKey(key: string): boolean {
  return COLOR_SETTING_KEYS.has(key);
}

export function isLiveBrandingKey(key: string): boolean {
  return LIVE_BRANDING_KEYS.has(key);
}

// ─────────────────────────────────────────────────────────────
// valueType-aware validation & coercion
// ─────────────────────────────────────────────────────────────

export type ValueValidationResult =
  | { ok: true; value: unknown }
  | { ok: false; error: string };

/**
 * Validates (and lightly normalizes) a raw value against a setting value type.
 * STRING   → must be a string
 * NUMBER   → must be a finite number, numeric string, or null (nullable keys)
 * BOOLEAN  → must be a boolean (or strict "true"/"false" string coercion)
 * JSON     → must be a serializable plain value (object/array/scalar)
 */
export function validateSettingValue(
  valueType: SettingValueType,
  raw: unknown,
  options?: { allowNull?: boolean },
): ValueValidationResult {
  const allowNull = options?.allowNull ?? true;
  if (raw == null || raw === "") {
    if (allowNull) return { ok: true, value: null };
    return { ok: false, error: "A value is required for this setting." };
  }

  switch (valueType) {
    case SettingValueType.STRING: {
      if (typeof raw === "string") return { ok: true, value: raw };
      if (typeof raw === "number" || typeof raw === "boolean") return { ok: true, value: String(raw) };
      return { ok: false, error: "Expected a string value." };
    }
    case SettingValueType.NUMBER: {
      if (typeof raw === "number") {
        if (!Number.isFinite(raw)) return { ok: false, error: "Number must be finite." };
        return { ok: true, value: raw };
      }
      if (typeof raw === "string") {
        const n = Number(raw);
        if (raw.trim() !== "" && !Number.isNaN(n)) return { ok: true, value: n };
        if (raw.trim() === "") return { ok: true, value: null };
        return { ok: false, error: `"${raw}" is not a valid number.` };
      }
      if (typeof raw === "boolean") return { ok: true, value: raw ? 1 : 0 };
      return { ok: false, error: "Expected a number value." };
    }
    case SettingValueType.BOOLEAN: {
      if (typeof raw === "boolean") return { ok: true, value: raw };
      if (raw === "true") return { ok: true, value: true };
      if (raw === "false") return { ok: true, value: false };
      if (typeof raw === "number") return { ok: true, value: raw !== 0 };
      return { ok: false, error: "Expected a boolean value." };
    }
    case SettingValueType.JSON: {
      try {
        // JSON strings are parsed so a textarea can submit raw JSON.
        const parsed = typeof raw === "string" ? (JSON.parse(raw) as unknown) : raw;
        if (
          parsed === null ||
          ["string", "number", "boolean"].includes(typeof parsed) ||
          Array.isArray(parsed) ||
          (typeof parsed === "object" && parsed !== null)
        ) {
          return { ok: true, value: parsed };
        }
        return { ok: false, error: "Expected a JSON-compatible value." };
      } catch {
        return { ok: false, error: "Value must be valid JSON." };
      }
    }
    default:
      return { ok: false, error: `Unsupported value type "${valueType}".` };
  }
}