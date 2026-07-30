import { env } from "./env.js";
import prisma, { connectDatabase, disconnectDatabase } from "./database.js";
import { configureSwagger } from "./swagger.js";

export  const config = {
    ...env,
    pagination: env.pagination,
} as const;

export {
    env,
    prisma,
    connectDatabase,
    disconnectDatabase,
    configureSwagger,
};