# Learning Management System API

TypeScript API for a multi-tenant learning management system. It supports course delivery, Programs, assessments, attendance, submissions, notifications, certificates, and XP rewards.

## Highlights

- Course and Program lifecycle management
- Audiences, cohorts, eligibility, enrollment, waitlists, and retakes
- Program phases, blocking tasks, waivers, milestones, and surveys
- Assessment attempts with configurable score aggregation
- Text, link, peer-review, and AWS S3 file submissions
- Attendance and secure live-session check-in
- Authoritative completion, certificate, and XP processing
- Analytics, audit history, notifications, and durable delivery outboxes
- Tenant isolation and role-based access control

## Stack

Node.js, TypeScript, Express, PostgreSQL, Prisma, Redis, RabbitMQ, AWS S3, Vitest, and Swagger.

## Local setup

Requirements: Node.js 20+, PostgreSQL, Redis, and RabbitMQ.

```bash
npm ci
cp .env.example .env
npm run prisma:generate
npx prisma migrate deploy
npm run dev
```

Configure `.env` with database, authentication, messaging, storage, email, and client URL settings. Never commit real credentials.

API routes use the configured `API_PREFIX`. Swagger is available at `/docs` when `SWAGGER_ENABLED=true`.

## Commands

```bash
npm run dev                              # Development server
npm run build                            # Compile TypeScript
npx vitest run --exclude 'dist/**'       # Run tests
npx prisma validate                      # Validate the schema
npx prisma migrate deploy                # Apply migrations
npm run prisma:seed                      # Seed development data
```

## Structure

- `src/modules` — domain modules
- `src/common` — shared middleware, validation, and permissions
- `src/integration` — external service integrations
- `src/routes` — API route composition
- `prisma` — schema, migrations, and seed data
