import swaggerJsdoc from "swagger-jsdoc";
import { env } from "../config/env.js";

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.3",

        info: {
            title: "Learning Management System API",
            version: "1.0.0",
            description:
                "Enterprise Learning Management System (LMS) Backend API Documentation",
        },

        servers: [
            {
                url: `http://localhost:${env.app.port}${env.app.apiPrefix}`,
                description: "Development Server",
            },
        ],

        tags: [
            { name: "Health", description: "Application health endpoints" },
            { name: "Authentication", description: "Authentication APIs" },
            { name: "Courses", description: "Course Management" },
            { name: "Learning Programs", description: "Learning Program Management" },
            { name: "Enrollments", description: "Enrollment APIs" },
            { name: "Assessments", description: "Assessment APIs" },
            { name: "Certificates", description: "Certificate APIs" },
            { name: "TNA", description: "Training Needs Analysis APIs" },
            { name: "Analytics", description: "Reporting APIs" },
        ],

        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },

        security: [
            {
                bearerAuth: [],
            },
        ],
    },

    apis: [
        "./src/modules/**/*.controller.ts",
        "./src/routes/**/*.ts",
    ],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;