# LMS - Authentication System Integration Guide

## Overview

The Learning Management System (LMS) has been successfully integrated with the centralized Authentication System using OAuth2. This guide provides setup instructions and implementation details.

## Integration Components

### Backend Changes

#### 1. **Database Schema** (`prisma/schema.prisma`)
Added three new models:
- `ServiceSession` - Manages LMS user sessions linked to Auth Service sessions
- `RefreshToken` - Stores hashed refresh tokens with expiry tracking  
- `AuthorizationCode` - Temporary authorization codes for OAuth2 flow

#### 2. **Auth Services** (`src/common/services/token.service.ts`)
Core service for token/session management:
- `validateToken()` - Validate and decode JWT tokens
- `createSession()` - Create service session after OAuth code exchange
- `getSession()` - Retrieve and validate active sessions
- `refreshTokens()` - Refresh expired tokens via Auth Service
- `revokeSession()` - Revoke individual sessions
- `cleanupExpiredSessions()` - Periodic cleanup task

#### 3. **Auth Controller** (`src/common/auth/auth.controller.ts`)
Endpoints:
- `POST /api/auth/callback` - OAuth2 callback handler (exchanges code for session)
- `GET /api/auth/me` - Get current authenticated user info
- `POST /api/auth/refresh` - Refresh session tokens
- `POST /api/auth/logout` - Logout and revoke session

#### 4. **Auth Middleware** (`src/common/auth/auth.middleware.ts`)
Updated to:
- Read `lms_session` cookie instead of Authorization header
- Validate JWT tokens stored in session
- Auto-refresh expired tokens
- Support role-based access control

#### 5. **Auth Routes** (`src/common/auth/auth.routes.ts`)
Routes for OAuth2 callback and session management endpoints.

#### 6. **RabbitMQ Integration**
- **Adapter** (`src/integrations/rabbitmq/rabbitmq.adapter.ts`) - Manages RabbitMQ connections
- **HTTP Client** (`src/integrations/auth-client/auth-http.client.ts`) - Communicates with Auth Service via HTTP
- **Session Revocation Consumer** (`src/integration/events/consumers/session-revocation.consumer.ts`) - Listens to `auth.session.revoked` events and revokes LMS sessions

#### 7. **Bootstrap** (`src/common/bootstrap/auth.bootstrap.ts`)
Initializes all auth-related services at startup:
- RabbitMQ adapter connection
- Auth HTTP client
- Token service
- Event consumers
- Periodic session cleanup job

### Environment Configuration

Add the following to your `.env` file:

```env
# Auth Service Integration
AUTH_SERVICE_URL=http://auth-service:3000
AUTH_CLIENT_ID=lms-service
AUTH_CLIENT_SECRET=lms_dev_secret

# JWT
JWT_SECRET=dev_access_secret_change_in_prod

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
```

### Infrastructure Updates

#### 1. **PostgreSQL** (`postgres/init-databases.sql`)
Added LMS database and user:
```sql
CREATE USER lms_user WITH PASSWORD 'lms_pass';
CREATE DATABASE lms_db OWNER lms_user;
```

#### 2. **RabbitMQ** (`rabbitmq/definitions.json`)
- Added `lms` exchange (topic)
- Added `q.lms.session.revoked` queue
- Binding between `auth` exchange and `q.lms.session.revoked` with routing key `auth.session.revoked`

#### 3. **Docker Compose** (`docker-compose.yml`)
Added LMS service configuration:
- Port: 3005 (development)
- Depends on: rabbitmq, postgres, redis, auth-service
- Environment variables for Auth Service integration
- Added `LMS_CLIENT_SECRET` to Auth Service config

### Frontend Changes

#### 1. **OAuth Login Screen** (`src/app/pages/Auth/OAuthLoginScreen.tsx`)
New component that redirects users to the Auth Service login page.

#### 2. **OAuth Callback Handler** (`src/app/pages/Auth/OAuthCallbackScreen.tsx`)
Handles the OAuth2 callback:
- Receives authorization code from Auth Service
- Exchanges code for session via `POST /api/auth/callback`
- Sets `lms_session` cookie
- Redirects to dashboard

#### 3. **OAuth Service** (`src/app/services/oauth.service.ts`)
Utilities for OAuth2 flow:
- `redirectToAuthServiceLogin()` - Redirect to Auth Service login
- `getCurrentUserSession()` - Get current user from backend
- `logoutUser()` - Logout via backend
- `refreshSession()` - Refresh session tokens

## Setup Instructions

### 1. Database Migration

```bash
cd learning-management-system/lms-backend
npx prisma migrate dev --name add_auth_models
```

This creates the ServiceSession, RefreshToken, and AuthorizationCode tables.

### 2. Install Dependencies

```bash
# Backend
cd learning-management-system/lms-backend
npm install

# Frontend
cd ../lms-fronend
npm install
```

### 3. Configure Environment Variables

Create `.env` file in `lms-backend`:
```env
NODE_ENV=development
PORT=3000
API_PREFIX=/api
DATABASE_URL=postgresql://lms_user:lms_pass@localhost:5432/lms_db
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
AUTH_SERVICE_URL=http://auth-service:3000
AUTH_CLIENT_ID=lms-service
AUTH_CLIENT_SECRET=lms_dev_secret
JWT_SECRET=dev_access_secret_change_in_prod
REDIS_URL=redis://localhost:6379
CLIENT_URL=http://localhost:5175
```

Create `.env` file in `lms-fronend`:
```env
VITE_AUTH_SERVICE_URL=http://localhost:3861
```

### 4. Start Docker Infrastructure

```bash
cd sd-meta-repo
docker-compose up -d
```

This starts:
- PostgreSQL with LMS database
- RabbitMQ with LMS exchange and queues
- Redis cache
- Auth Service
- LMS Service (at port 3005)

### 5. Start LMS Backend

```bash
cd learning-management-system/lms-backend
npm run dev
```

The LMS API will run on port 3000 (inside Docker) or 3005 (exposed).

### 6. Start LMS Frontend

```bash
cd learning-management-system/lms-fronend
npm run dev
```

The LMS UI will run on port 5175 (or check terminal for actual port).

## OAuth2 Flow

### Step-by-step

1. **User clicks "Sign In"** on LMS login page
   - Frontend redirects to Auth Service: `http://localhost:3861/login?client_id=lms-service&redirect_uri=...`

2. **User authenticates** with Auth Service
   - Enters credentials
   - Auth Service validates and creates Auth session

3. **Auth Service redirects** back to LMS with authorization code
   - Redirect to: `http://localhost:5175/oauth-callback?code=xxx`

4. **LMS exchanges code** for tokens
   - Frontend calls: `POST /api/auth/callback` with the code
   - Backend exchanges code for tokens via Auth Service
   - Backend creates LMS ServiceSession
   - Backend sets `lms_session` cookie

5. **User is logged in**
   - Frontend stores session data
   - Redirects to dashboard
   - All subsequent requests include `lms_session` cookie

### Token Refresh Flow

1. User makes request with expired access token
2. Auth middleware detects expired token
3. Middleware calls `tokenService.refreshTokens()`
4. Service fetches new tokens from Auth Service
5. Service updates database with new tokens
6. Request continues with new token

### Session Revocation Flow

1. User logs out from central Auth Service
2. Auth Service publishes `auth.session.revoked` event to RabbitMQ
3. LMS `SessionRevocationConsumer` receives event
4. Consumer calls `tokenService.revokeUserSessions()`
5. All LMS sessions for user are deactivated
6. Refresh tokens are marked as revoked

## Testing

### 1. Test OAuth Login Flow

```bash
# Visit LMS UI
http://localhost:5175

# Click "Sign In" button
# Should redirect to Auth Service login
# After login, should return to LMS dashboard
```

### 2. Test Session Management

```bash
# Get current user
curl -b "lms_session=xxx" http://localhost:3000/api/auth/me

# Refresh tokens
curl -X POST -b "lms_session=xxx" http://localhost:3000/api/auth/refresh

# Logout
curl -X POST -b "lms_session=xxx" http://localhost:3000/api/auth/logout
```

### 3. Monitor RabbitMQ Events

Visit RabbitMQ Management UI: http://localhost:15672
- Default credentials: guest / guest
- Check queues and bindings under the `Queues` tab
- Verify `q.lms.session.revoked` queue is bound to `auth` exchange

## Troubleshooting

### Issue: "Session not found" error

**Cause**: Cookie not being set or not sent with requests

**Solution**:
1. Check that `Cookie-Parser` middleware is enabled in `app.ts`
2. Verify CORS credentials are enabled: `credentials: true`
3. Check browser cookie settings (allow third-party cookies if needed)

### Issue: Token validation fails

**Cause**: JWT secret mismatch between Auth Service and LMS

**Solution**:
1. Verify `JWT_SECRET` env var is the same in both services
2. Use shared .env from infrastructure repo

### Issue: RabbitMQ connection fails

**Cause**: RabbitMQ service not running or incorrect URL

**Solution**:
1. Verify RabbitMQ container is running: `docker ps | grep rabbitmq`
2. Check connection string: `RABBITMQ_URL`
3. Check RabbitMQ logs: `docker logs telalaki`

### Issue: Session revocation not working

**Cause**: Consumer not connected or queue not bound

**Solution**:
1. Check RabbitMQ definitions.json includes `q.lms.session.revoked` queue
2. Verify binding exists in RabbitMQ Management UI
3. Check LMS logs for consumer startup messages

## API Endpoints Reference

### Authentication Endpoints

#### POST /api/auth/callback
Exchange OAuth2 authorization code for session

```bash
curl -X POST http://localhost:3000/api/auth/callback \
  -H "Content-Type: application/json" \
  -d '{
    "code": "authorization_code_from_auth_service",
    "redirect_uri": "http://localhost:5175/dashboard"
  }' \
  -c cookies.txt
```

#### GET /api/auth/me
Get current authenticated user info

```bash
curl http://localhost:3000/api/auth/me \
  -b "lms_session=session_id_from_cookie"
```

#### POST /api/auth/refresh
Refresh session tokens

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -b "lms_session=session_id_from_cookie"
```

#### POST /api/auth/logout
Logout and revoke session

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b "lms_session=session_id_from_cookie"
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│           LMS Frontend (React)                       │
│  ┌──────────────────────────────────────────────┐   │
│  │  OAuthLoginScreen                            │   │
│  │  (redirects to Auth Service)                 │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │  OAuthCallbackScreen                         │   │
│  │  (exchanges code for session)                │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
         │                                  ▲
         │ Redirect to Auth login          │ Set lms_session cookie
         │                                  │
         ▼                                  │
┌─────────────────────────────────────────────────────┐
│           LMS Backend (Node.js/Express)             │
│  ┌──────────────────────────────────────────────┐   │
│  │  POST /auth/callback                         │   │
│  │  - Exchanges code for tokens                 │   │
│  │  - Creates ServiceSession                    │   │
│  │  - Sets lms_session cookie                   │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │  Auth Middleware                             │   │
│  │  - Validates lms_session cookie              │   │
│  │  - Validates JWT token                       │   │
│  │  - Auto-refreshes expired tokens             │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
         │                                  ▲
         │ HTTP (OAuth code exchange)      │ HTTP (tokens)
         │                                  │
         ▼                                  │
┌─────────────────────────────────────────────────────┐
│           Auth Service                              │
│  - Validates credentials                            │
│  - Issues authorization codes                       │
│  - Exchanges codes for tokens                       │
│  - Publishes revocation events                      │
└─────────────────────────────────────────────────────┘
                    │                         ▲
                    │ RabbitMQ events        │
                    │ (session revoked)      │ RabbitMQ RPC
                    ▼                         │
         ┌─────────────────────────┐  ┌──────────────┐
         │  RabbitMQ Broker        │  │  Redis Cache │
         │                         │  │              │
         │  - auth exchange        │  │ Token cache  │
         │  - lms exchange         │  │  (optional)  │
         │  - q.lms.session.revoked│  └──────────────┘
         └─────────────────────────┘
                    │
                    │ Event subscription
                    │
                    ▼
         ┌──────────────────────────────┐
         │ SessionRevocationConsumer    │
         │ - Listens for revocation     │
         │ - Revokes user sessions      │
         └──────────────────────────────┘
                    │
                    ▼
         ┌──────────────────────────────┐
         │  PostgreSQL - lms_db         │
         │  - ServiceSession            │
         │  - RefreshToken              │
         │  - AuthorizationCode         │
         └──────────────────────────────┘
```

## Next Steps

1. **Update Frontend App.tsx**: Modify the main App component to use `OAuthLoginScreen` instead of the old local login
2. **Create OAuth Callback Route**: Add route in frontend router to handle `/oauth-callback`
3. **Test Full Flow**: Verify complete OAuth2 login and logout flow
4. **Configure Role Mappings**: Update `mapRoleIdToRole()` in `oauth.service.ts` to match your role ID values
5. **Setup Monitoring**: Configure logging and monitoring for auth events
6. **Production Hardening**: Update secrets, CORS origins, and cookie security settings

## Support

For issues or questions, refer to:
- Auth Service README: `authentication-system/auth-service/backend/README.md`
- LMS Backend logs: Check console output during development
- RabbitMQ Management UI: http://localhost:15672 (guest/guest)
