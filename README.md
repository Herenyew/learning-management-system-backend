# Learning Management System Backend

A TypeScript backend for a Learning Management System built with Express, Prisma, JWT authentication, RabbitMQ integration, and Swagger documentation.

## Features

- Express API with structured routing and centralized middleware
- Prisma ORM for database modeling and migrations
- JWT-based authentication support
- RabbitMQ messaging integration prepared for event-driven workflows
- Swagger UI available at `/docs`
- Runtime environment validation using `zod`

## Prerequisites

- Node.js 20+ (recommended)
- npm 10+ or yarn
- PostgreSQL or another Prisma-supported database
- RabbitMQ broker for message queueing

## Setup

Install dependencies:

```bash
npm install
```

Generate Prisma client:

```bash
npm run prisma:generate
```

Run database migrations:

```bash
npm run prisma:migrate
```

## Environment Variables

Create a `.env` file at the project root with values similar to the following:

```env
NODE_ENV=development
PORT=3000
API_PREFIX=/api
DATABASE_URL=postgresql://user:password@localhost:5432/lms
JWT_SECRET=supersecretkey
JWT_EXPIRES_IN=1h
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_EXCHANGE=learning_exchange
RABBITMQ_QUEUE=learning_queue
CLOUD_PROVIDER=aws
AWS_REGION=us-east-1
AWS_BUCKET_NAME=my-bucket
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AZURE_STORAGE_ACCOUNT=
AZURE_STORAGE_KEY=
AZURE_CONTAINER_NAME=
GCP_PROJECT_ID=
GCP_BUCKET_NAME=
GCP_KEY_FILE=
LOG_LEVEL=info
SWAGGER_ENABLED=true
CLIENT_URL=http://localhost:3000
```

> Only one cloud provider configuration is required. Azure/GCP settings can remain empty if not used.

## Available Scripts

- `npm run dev` - Start the backend in watch mode using `tsx`
- `npm run build` - Compile TypeScript into `dist/`
- `npm start` - Run the compiled production app
- `npx prisma generate` - Generate the Prisma client
- `npx prisma migrate` - Apply Prisma migrations

## Running Locally

Start the development server:

```bash
npm run dev
```

The app will load settings from `.env`, connect to the database, and expose routes under the configured `API_PREFIX`.

## API Documentation

Swagger UI is available at:

```text
http://localhost:3000/docs
```

## Project Structure

- `src/app.ts` - Express app configuration, middleware, and routes
- `src/server.ts` - Bootstrap logic for starting/stopping the server and connecting infrastructure
- `src/config` - Application configuration, environment validation, logger, Swagger, and database setup
- `src/modules` - Feature modules and domain-specific services
- `src/routes` - Route definitions and router exports
- `src/common` - Shared middleware, auth, error handling, and validation helpers
- `prisma/` - Prisma schema, migrations, and seed data

## Notes

- RabbitMQ connectivity exists in the codebase, but some connect/disconnect operations are currently marked as TODO.
- Extend the backend by adding new modules, services, and route handlers.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Install dependencies
4. Add your changes
5. Run migrations and test locally
6. Open a pull request with a clear description

## License

This repository does not include a license file yet. Add a license before publishing or sharing publicly.
