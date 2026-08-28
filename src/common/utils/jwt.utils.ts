// common/utils/jwt.utils.ts
import jwt from 'jsonwebtoken';
import { TokenPayload } from '../../modules/auth/auth.types.js';

/**
 * Read JWT_SECRET lazily at call-time, not at module-load time.
 * Top-level const captures the value before dotenv.config() can run
 * in ESM where all imports are evaluated before the module body executes.
 */
function getSecret(): string {
  return process.env.JWT_SECRET || 'default-secret-change-me';
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, getSecret()) as TokenPayload;
}

export function signToken(payload: any): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '15m' });
}