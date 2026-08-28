// config/database.ts
import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";
import logger from "./logger.js";

declare global {
  var prisma: PrismaClient | undefined;
}

// ─── Prisma Client Singleton ──────────────────────────────────────────────

const prisma = global.prisma ?? new PrismaClient({
  log: env.app.nodeEnv === "development"
    ? ["query", "info", "warn", "error"]
    : ["warn", "error"],
});

if (env.app.nodeEnv !== "production") {
  global.prisma = prisma;
}

// ─── Database Connection Functions ────────────────────────────────────────

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info("[Database] PostgreSQL connected successfully.");
  } catch (error) {
    logger.error("[Database] Failed to connect to PostgreSQL.");
    logger.error(error);
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info("[Database] PostgreSQL disconnected.");
}

export function getPrismaClient(): PrismaClient {
  return prisma;
}

export default prisma;