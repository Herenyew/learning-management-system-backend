import { randomBytes } from "node:crypto";

export const generateCertificateNumber = () =>
  `CERT-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
