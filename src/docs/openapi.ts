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
      { name: "Audience Configuration", description: "Audience Groups & Dynamic Rule Management" },
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

      schemas: {
        // ==========================================
        // Audience Group Schemas
        // ==========================================
        AudienceGroup: {
          type: "object",
          required: ["id", "companyId", "name"],
          properties: {
            id: { type: "integer", example: 1 },
            companyId: { type: "integer", example: 1 },
            name: { type: "string", example: "Engineering Team" },
            description: { type: "string", nullable: true, example: "All software engineers and technical leads" },
            isActive: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        CreateAudienceGroupInput: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", example: "Engineering Team" },
            description: { type: "string", example: "All software engineers and technical leads" },
            isActive: { type: "boolean", default: true },
          },
        },

        UpdateAudienceGroupInput: {
          type: "object",
          properties: {
            name: { type: "string", example: "Software Engineering Division" },
            description: { type: "string", example: "Updated description for dev team" },
            isActive: { type: "boolean" },
          },
        },

        // ==========================================
        // Audience Rule Schemas
        // ==========================================
        AudienceGroupRule: {
          type: "object",
          required: ["id", "audienceGroupId", "ruleType", "operator", "value"],
          properties: {
            id: { type: "integer", example: 10 },
            audienceGroupId: { type: "integer", example: 1 },
            ruleType: {
              type: "string",
              example: "DEPARTMENT",
              enum: ["DEPARTMENT", "JOB_TITLE", "LOCATION", "EMPLOYMENT_TYPE"],
            },
            operator: {
              type: "string",
              example: "EQUALS",
              enum: ["EQUALS", "NOT_EQUALS", "IN", "NOT_IN", "CONTAINS"],
            },
            value: { type: "string", example: "Engineering" },
            createdAt: { type: "string", format: "date-time" },
          },
        },

        CreateAudienceGroupRuleInput: {
          type: "object",
          required: ["ruleType", "operator", "value"],
          properties: {
            ruleType: {
              type: "string",
              example: "DEPARTMENT",
              enum: ["DEPARTMENT", "JOB_TITLE", "LOCATION", "EMPLOYMENT_TYPE"],
            },
            operator: {
              type: "string",
              example: "EQUALS",
              enum: ["EQUALS", "NOT_EQUALS", "IN", "NOT_IN", "CONTAINS"],
            },
            value: { type: "string", example: "Engineering" },
          },
        },

        UpdateAudienceGroupRuleInput: {
          type: "object",
          properties: {
            ruleType: { type: "string", example: "JOB_TITLE" },
            operator: { type: "string", example: "CONTAINS" },
            value: { type: "string", example: "Developer" },
          },
        },

        // ==========================================
        // Member Resolution & Check Response
        // ==========================================
        AudienceMember: {
          type: "object",
          properties: {
            employeeId: { type: "string", example: "EMP001" },
            fullName: { type: "string", example: "John Doe" },
            email: { type: "string", example: "john.doe@company.com" },
            department: { type: "string", example: "Engineering" },
            jobTitle: { type: "string", example: "Senior Fullstack Engineer" },
          },
        },

        AudienceMemberCheckResponse: {
          type: "object",
          properties: {
            audienceGroupId: { type: "integer", example: 1 },
            employeeId: { type: "string", example: "EMP001" },
            matches: { type: "boolean", example: true },
          },
        },

        // ==========================================
        // Common API Error Standard
        // ==========================================
        ApiError: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Resource not found or validation failed." },
            code: { type: "string", example: "UNAUTHORIZED" },
            errors: {
              type: "array",
              items: { type: "object" },
              nullable: true,
            },
          },
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
    "./src/modules/**/*.routes.ts",
    "./src/routes/**/*.ts",
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;