import { Express } from "express";
import swaggerUi from "swagger-ui-express";

import swaggerSpec from "../docs/openapi.js";
import { env } from "./env.js";

export function configureSwagger(app: Express): void {
    if (!env.swagger.enabled) {
        return;
    }

    app.use(
        "/docs",
        swaggerUi.serve,
        swaggerUi.setup(swaggerSpec, {
            explorer: true,
            customSiteTitle: "LMS API Documentation",
        })
    );
}