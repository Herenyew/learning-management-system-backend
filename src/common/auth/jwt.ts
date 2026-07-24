import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";

import type { TokenPayload } from "./token-payload.js";

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(
    token,
    env.jwt.secret
  ) as TokenPayload;
}