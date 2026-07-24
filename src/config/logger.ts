import winston from "winston";
import { env } from "./env.js";

const logger = winston.createLogger({
    level: env.logger.level,

    format: winston.format.combine(
        winston.format.timestamp({
            format: "YYYY-MM-DD HH:mm:ss",
        }),
        winston.format.errors({
            stack: true,
        }),
        winston.format.printf(({ timestamp, level, message, stack }) => {
            return stack
                ? `[${timestamp}] ${level.toUpperCase()}: ${stack}`
                : `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        })
    ),

    transports: [
        new winston.transports.Console(),
    ],

    exitOnError: false,
});

export default logger;