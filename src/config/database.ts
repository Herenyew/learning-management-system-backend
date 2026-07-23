import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";
import logger from "./logger.js";

declare global {
  var prisma: PrismaClient | undefined;
}

// Simple initialization: Prisma 6 will automatically parse process.env.DATABASE_URL
const prisma = global.prisma ?? new PrismaClient({
  log: env.app.nodeEnv === "development" 
    ? ["query", "info", "warn", "error"] 
    : ["warn", "error"],
});

if (env.app.nodeEnv !== "production") {
  global.prisma = prisma;
}

export async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info("PostgreSQL connected successfully.");
  } catch (error) {
    logger.error("Failed to connect to PostgreSQL.");
    logger.error(error);
    process.exit(1);
  }
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
  logger.info("PostgreSQL disconnected.");
}

export default prisma;
