// ============================================================
// Secret setting encryption
//
// Secrets under INTEGRATIONS (and custom secret keys) are never
// stored or returned in plain text. Values are encrypted at rest
// with AES-256-GCM using a key derived from ENCRYPTION_KEY
// (falling back to JWT_SECRET).
// ============================================================

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { env } from "../../../config/env.js";

const SECRET_PREFIX = "enc:v1:";
const ENCRYPTION_KEY = scryptSync(
  process.env.ENCRYPTION_KEY || env.jwt.secret,
  "learnos-system-settings",
  32,
);

function toBuffer(value: string): Buffer {
  return Buffer.from(value, "utf8");
}

function isBase64(value: string): boolean {
  return /^[A-Za-z0-9+/]+={0,2}$/.test(value) && value.length % 4 === 0;
}

/** Encrypt a string value → "enc:v1:<ivBase64>:<tagBase64>:<cipherBase64>". */
export function encryptSettingValue(plainText: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(toBuffer(plainText)), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${SECRET_PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

/** Decrypt a value produced by encryptSettingValue. Throws on tamper. */
export function decryptSettingValue(payload: string): string {
  if (!payload.startsWith(SECRET_PREFIX)) return payload;
  const [, ivPart, tagPart, dataPart] = payload.split(":");
  if (!ivPart || !tagPart || !dataPart || !isBase64(ivPart) || !isBase64(tagPart) || !isBase64(dataPart)) {
    throw new Error("Malformed encrypted setting value.");
  }
  const decipher = createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, Buffer.from(ivPart, "base64"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataPart, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export function isEncryptedSettingValue(value: string): boolean {
  return value.startsWith(SECRET_PREFIX);
}

/** Constant-time helper for equality checks (guards against length oracle). */
export function safeEqual(left: string, right: string): boolean {
  const l = toBuffer(left);
  const r = toBuffer(right);
  return l.length === r.length && timingSafeEqual(l, r);
}

/** Never leak secrets — returns a masked placeholder. */
export function maskSettingValue(secret: string): string {
  if (!secret) return "••••••••";
  if (secret.length <= 8) return "••••••••";
  return `${secret.slice(0, 2)}••••••••${secret.slice(-2)}`;
}