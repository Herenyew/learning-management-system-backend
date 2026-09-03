import type { NotificationEventDefinition } from "./events.js";
import type { NotificationVariable, RenderedNotification } from "./types.js";

const placeholderPattern = /{{\s*([a-zA-Z0-9_.]+)\s*}}/g;

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const variableText = (value: NotificationVariable) => {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value);
};

export const interpolateTemplate = (
  template: string,
  variables: Record<string, NotificationVariable>,
  html = false,
) =>
  template.replace(placeholderPattern, (_match, key: string) => {
    const value = variableText(variables[key]);
    return html ? escapeHtml(value) : value;
  });

const defaultHtml = (title: string, body: string, actionLabel: string, actionUrl: string) => `
<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f5f7f2;font-family:Arial,sans-serif;color:#1f2a1f">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #dfe6d8;border-radius:14px;overflow:hidden">
          <tr><td style="background:#496b2f;padding:20px 28px;color:#ffffff;font-size:18px;font-weight:700">LMS Learning Platform</td></tr>
          <tr><td style="padding:28px">
            <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3">${escapeHtml(title)}</h1>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b5d4b">${escapeHtml(body)}</p>
            <a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:#496b2f;color:#ffffff;text-decoration:none;padding:11px 18px;border-radius:8px;font-size:14px;font-weight:700">${escapeHtml(actionLabel)}</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

type ManagedEmailTemplate = {
  eventKey: string;
  subject?: string;
  body?: string;
  html?: string;
};

export const parseManagedEmailTemplate = (
  data: unknown,
  eventCode: string,
): ManagedEmailTemplate | null => {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const value = data as Record<string, unknown>;
  if (value.eventKey !== eventCode) return null;
  if (
    (value.subject !== undefined && typeof value.subject !== "string") ||
    (value.body !== undefined && typeof value.body !== "string") ||
    (value.html !== undefined && typeof value.html !== "string")
  ) {
    return null;
  }
  return {
    eventKey: eventCode,
    ...(typeof value.subject === "string" ? { subject: value.subject } : {}),
    ...(typeof value.body === "string" ? { body: value.body } : {}),
    ...(typeof value.html === "string" ? { html: value.html } : {}),
  };
};

export const renderNotificationTemplate = (input: {
  definition: NotificationEventDefinition;
  managedTemplateData?: unknown;
  eventCode: string;
  variables: Record<string, NotificationVariable>;
  actionUrl: string;
}): RenderedNotification => {
  const managed = parseManagedEmailTemplate(input.managedTemplateData, input.eventCode);
  const title = interpolateTemplate(input.definition.title, input.variables)
    .replace(/[\r\n]+/g, " ")
    .trim();
  const body = interpolateTemplate(input.definition.body, input.variables);
  const subject = interpolateTemplate(
    managed?.subject ?? input.definition.subject,
    input.variables,
  )
    .replace(/[\r\n]+/g, " ")
    .trim();
  const emailBody = interpolateTemplate(
    managed?.body ?? input.definition.body,
    input.variables,
  );
  const html = managed?.html
    ? interpolateTemplate(managed.html, input.variables, true)
    : defaultHtml(subject, emailBody, input.definition.actionLabel, input.actionUrl);

  return { title, body, subject, emailBody, html };
};
