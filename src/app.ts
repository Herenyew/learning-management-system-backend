import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";

import { env } from "./config/env.js";
import { configureSwagger } from "./config/swagger.js";

import router from "./routes/index.js";

import requestLogger from "./common/middlewares/request-logger.middleware.js";
import notFoundMiddleware from "./common/middlewares/not-found.middleware.js";
import errorMiddleware from "./common/middlewares/error.middleware.js";

const app = express();

/*
|--------------------------------------------------------------------------
| Global Middlewares
|--------------------------------------------------------------------------
*/

app.use(helmet());

app.use(
    cors({
        origin: env.cors.clientUrl,
        credentials: true,
    })
);

app.use(compression());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(requestLogger);

/*
|--------------------------------------------------------------------------
| Swagger
|--------------------------------------------------------------------------
*/

configureSwagger(app);

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use(env.app.apiPrefix, router);

/*
|--------------------------------------------------------------------------
| Error Handling
|--------------------------------------------------------------------------
*/

app.use(notFoundMiddleware);

app.use(errorMiddleware);

export default app;