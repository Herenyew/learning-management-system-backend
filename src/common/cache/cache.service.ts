/**
 * Redis cache singleton — gracefully degrades to no-op if Redis is unavailable.
 * Uses ioredis. Keys are namespaced per feature area.
 */
import { Redis } from "ioredis";
import { env } from "../../config/env.js";
import logger from "../../config/logger.js";

const DEFAULT_TTL_SECONDS = 300; // 5 minutes

class CacheService {
  private client: Redis | null = null;
  private available = false;

  constructor() {
    try {
      const url = (env.redis as { url?: string }).url ?? "redis://localhost:6379";
      this.client = new Redis(url, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      });

      this.client.on("connect", () => {
        this.available = true;
        logger.info("[Cache] Redis connected");
      });

      this.client.on("error", (err: Error) => {
        this.available = false;
        logger.warn(`[Cache] Redis error (cache degraded): ${err.message}`);
      });

      this.client.connect().catch(() => {
        this.available = false;
        logger.warn("[Cache] Redis unavailable — running without cache");
      });
    } catch {
      this.available = false;
      logger.warn("[Cache] Redis init failed — running without cache");
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.available || !this.client) return null;
    try {
      const raw = await this.client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = DEFAULT_TTL_SECONDS): Promise<void> {
    if (!this.available || !this.client) return;
    try {
      await this.client.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch { /* swallow */ }
  }

  async del(key: string): Promise<void> {
    if (!this.available || !this.client) return;
    try { await this.client.del(key); } catch { /* swallow */ }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.available || !this.client) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) await this.client.del(...keys);
    } catch { /* swallow */ }
  }
}

export const cacheService = new CacheService();

/** Cache key helpers — all LMS cache keys are namespaced under `lms:` */
export const CacheKeys = {
  userPermissions: (userId: number) => `lms:user:permissions:${userId}`,
  userRoles:       (userId: number) => `lms:user:roles:${userId}`,
  rolePermissions: (roleId: number) => `lms:role:permissions:${roleId}`,
  emsMappings:     (companyId: number) => `lms:ems:mappings:${companyId}`,
} as const;
