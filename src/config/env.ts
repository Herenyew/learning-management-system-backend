import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
        // inside envSchema
    PAGINATION_DEFAULT_PAGE: z.coerce.number().positive().default(1),
    PAGINATION_DEFAULT_PAGE_SIZE: z.coerce.number().positive().default(20),
    PAGINATION_MAX_PAGE_SIZE: z.coerce.number().positive().default(100),

    ///////////////////////////////////////////////////////////
    // APPLICATION
    ///////////////////////////////////////////////////////////
    NODE_ENV: z.enum(["development", "test", "production"]),
    PORT: z.coerce.number().positive(),
    API_PREFIX: z.string(),

    ///////////////////////////////////////////////////////////
    // DATABASE
    ///////////////////////////////////////////////////////////
    DATABASE_URL: z.string().min(1),

    ///////////////////////////////////////////////////////////
    // AUTHENTICATION
    ///////////////////////////////////////////////////////////
    JWT_SECRET: z.string().min(8),
    JWT_EXPIRES_IN: z.string(),

    ///////////////////////////////////////////////////////////
    // AUTH SERVICE
    ///////////////////////////////////////////////////////////
    AUTH_SERVICE_URL: z.string().url(),
    AUTH_CLIENT_ID: z.string(),
    AUTH_CLIENT_SECRET: z.string(),

    ///////////////////////////////////////////////////////////
    // RABBITMQ
    ///////////////////////////////////////////////////////////
    RABBITMQ_URL: z.string().url(),
    RABBITMQ_EXCHANGE: z.string(),
    RABBITMQ_QUEUE: z.string(),

    ///////////////////////////////////////////////////////////
    // CLOUD STORAGE
    ///////////////////////////////////////////////////////////
    CLOUD_PROVIDER: z.enum(["aws", "azure", "gcp"]),

    // AWS
    AWS_REGION: z.string(),
    AWS_BUCKET_NAME: z.string(),
    AWS_ACCESS_KEY_ID: z.string(),
    AWS_SECRET_ACCESS_KEY: z.string(),

    // Azure (optional)
    AZURE_STORAGE_ACCOUNT: z.string().optional(),
    AZURE_STORAGE_KEY: z.string().optional(),
    AZURE_CONTAINER_NAME: z.string().optional(),

    // Google Cloud (optional)
    GCP_PROJECT_ID: z.string().optional(),
    GCP_BUCKET_NAME: z.string().optional(),
    GCP_KEY_FILE: z.string().optional(),

    ///////////////////////////////////////////////////////////
    // LOGGING
    ///////////////////////////////////////////////////////////
    LOG_LEVEL: z.enum([
        "error",
        "warn",
        "info",
        "http",
        "verbose",
        "debug",
        "silly",
    ]),

    ///////////////////////////////////////////////////////////
    // SWAGGER
    ///////////////////////////////////////////////////////////
    SWAGGER_ENABLED: z.coerce.boolean(),

    ///////////////////////////////////////////////////////////
    // CORS
    ///////////////////////////////////////////////////////////
    CLIENT_URL: z.string().url(),

    ///////////////////////////////////////////////////////////
    // REDIS
    ///////////////////////////////////////////////////////////
    REDIS_URL: z.string().optional().default("redis://localhost:6379"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("Invalid environment configuration");
    console.error(parsed.error.format());
    process.exit(1);
}

const config = parsed.data;

export const env = {
    app: {
        nodeEnv: config.NODE_ENV,
        port: config.PORT,
        apiPrefix: config.API_PREFIX,
    },

    database: {
        url: config.DATABASE_URL,
    },

    jwt: {
        secret: config.JWT_SECRET,
        expiresIn: config.JWT_EXPIRES_IN,
    },

    auth: {
        serviceUrl: config.AUTH_SERVICE_URL,
        clientId: config.AUTH_CLIENT_ID,
        clientSecret: config.AUTH_CLIENT_SECRET,
    },

    rabbitmq: {
        url: config.RABBITMQ_URL!,
    },

    storage: {
        provider: config.CLOUD_PROVIDER,

        aws: {
            region: config.AWS_REGION,
            bucket: config.AWS_BUCKET_NAME,
            accessKeyId: config.AWS_ACCESS_KEY_ID,
            secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
        },

        azure: {
            storageAccount: config.AZURE_STORAGE_ACCOUNT,
            storageKey: config.AZURE_STORAGE_KEY,
            container: config.AZURE_CONTAINER_NAME,
        },

        gcp: {
            projectId: config.GCP_PROJECT_ID,
            bucket: config.GCP_BUCKET_NAME,
            keyFile: config.GCP_KEY_FILE,
        },
    },

    logger: {
        level: config.LOG_LEVEL,
    },

    swagger: {
        enabled: config.SWAGGER_ENABLED,
    },

    cors: {
        clientUrl: config.CLIENT_URL,
    },
    redis: {
        url: config.REDIS_URL,
    },
// inside exported env object
    pagination: {
    defaultPage: config.PAGINATION_DEFAULT_PAGE,
    defaultPageSize: config.PAGINATION_DEFAULT_PAGE_SIZE,
    maxPageSize: config.PAGINATION_MAX_PAGE_SIZE,
    },
} as const;
