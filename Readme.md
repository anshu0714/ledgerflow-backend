# LedgerFlow Backend

A **Node.js** backend application for managing accounts, transactions, and ledgers.

LedgerFlow is a production-oriented fintech backend simulation implementing distributed caching, idempotency protection, transactional outbox pattern, immutable double-entry ledger architecture, Redis-backed scalability, and asynchronous event-driven workflows.

## Features

### Financial Transaction System

- Double-entry ledger system (DEBIT/CREDIT) ensuring accounting correctness
- Immutable ledger entries preventing financial record tampering
- MongoDB transactions for atomic debit/credit consistency
- Snapshot-based balance system for O(1) balance reads
- Cursor-paginated transaction history

### Idempotency & Exactly-Once Simulation

- Dedicated idempotency layer with request hashing
- Concurrency-safe duplicate request handling
- Transaction-safe idempotency persistence using MongoDB sessions
- Prevents duplicate financial transactions under retries

### Redis Scalability Layer

- Redis-backed distributed caching
- Redis-backed distributed rate limiting
- Shared rate limiting across multiple instances
- Automatic cache invalidation after balance-changing operations

### Outbox Pattern & Async Reliability

- Transactional outbox pattern for reliable async side effects
- Background worker processes events asynchronously
- Retry handling with delayed retries
- Dead-letter handling for permanently failed events
- Reliable email processing independent of API requests

### Authentication & Security

- JWT-based authentication
- Secure token extraction middleware
- Token blacklisting for logout protection
- Route-level authorization checks
- Request validation using Zod schemas

### Concurrency & Consistency

- Deterministic account locking strategy
- Prevents race conditions and double-spending
- Transaction-safe balance updates
- Consistent balance validation under concurrent requests

### Observability & Production Hardening

- Structured JSON logging
- Request tracing using request IDs
- API request duration monitoring
- Background worker monitoring
- System health logging
- Graceful async failure handling

## Architecture Highlights

### Idempotency Flow

Client Request → Idempotency Layer → Transaction Service → MongoDB Transaction

- Prevents duplicate financial operations
- Safely handles retries and concurrent duplicate requests
- Guarantees exactly-once transaction simulation

### Transaction + Ledger Flow

Transaction → Balance Snapshot Update → Immutable Ledger Entries → Commit

- Ledger acts as immutable audit history
- Account balance acts as optimized read model
- Guarantees atomic financial consistency

### Redis Cache Flow

Balance Request → Redis Cache → MongoDB Fallback → Cache Population

- O(1) cached balance retrieval
- Reduced database load
- Automatic cache invalidation after transactions

### Outbox Event Flow

Transaction Commit → Outbox Event → Background Worker → Email Processing

- Ensures reliable async side effects
- Supports retry recovery after failures
- Failed events moved to dead-letter state after retry exhaustion

### Failure Recovery

- Crash after DB commit → outbox event still processed
- Duplicate request → response replayed safely
- Email provider failure → retried asynchronously
- Permanent failures isolated using dead-letter handling

## Technologies Used

- **Node.js** & **Express.js**
- **MongoDB** & **Mongoose**
- **Redis**
- **JWT Authentication**
- **Zod Validation**
- **Nodemailer** for email notifications
- **Swagger/OpenAPI**
- **Docker**

## Folder Structure

```
src/
├── config
│   ├── db.js
│   ├── redis.js
├── controllers
│   ├── account.controller.js
│   ├── auth.controller.js
│   └── transaction.controller.js
├── middlewares
│   ├── auth.middleware.js
│   ├── logger.middleware.js
│   ├── rateLimiter.middleware.js
│   ├── requestId.middleware.js
│   ├── validate.middleware.js
│   └── validateQuery.middleware.js
├── models
│   ├── account.model.js
│   └── idempotencyKey.model.js
│   ├── ledger.model.js
│   ├── outbox.model.js
│   ├── tokenBlacklist.model.js
│   ├── transaction.model.js
│   └── user.model.js
├── routes
│   ├── account.routes.js
│   ├── auth.routes.js
│   └── transaction.routes.js
├── services
│   ├── cache.service.js
│   ├── rateLimiter.service.js
│   ├── idempotency.service.js
│   ├── transaction.service.js
│   ├── mail.service.js
│   └── outbox/
├── utils
│   ├── dbTransaction.utils.js
│   ├── apiResponse.utils.js
│   ├── hash.utils.js
│   ├── logger.utils.js
│   └── token.utils.js
├── validators
│   ├── account.validator.js
│   ├── auth.validator.js
│   ├── common.validator.js
│   ├── history.validator.js
│   └── transaction.validator.js
└── workers
    ├── outbox.worker.js
    └── startOutbox.worker.js
```

## Installation

Clone the repository:

```bash
git clone https://github.com/anshu0714/ledgerflow-backend.git
cd ledgerflow-backend
```

Install dependencies:

```bash
npm install
```

## Running Redis Locally

This project requires Redis for:

- Distributed caching
- Distributed rate limiting

**Run Redis using Docker**

```bash
docker run -d --name ledgerflow-redis -p 6379:6379 redis
```

Verify Redis is running:

```bash
docker exec -it ledgerflow-redis redis-cli
```

Inside Redis CLI:

```bash
PING
```

Expected response:

```bash
PONG
```

## Environment Variables

To run this project, you need to create a `.env` file at the root of the project and provide the following environment variables:

```env
PORT="3000"
MONGO_URI=<your-mongodb-connection-string>
REDIS_URL=redis://localhost:6379
JWT_SECRET=<your-secret-key>
CLIENT_ID=<client-id>
CLIENT_SECRET=<client-secret>
USER_EMAIL=<user-email>
REFRESH_TOKEN=<your-refresh-token>
```

**Note:**

- Generate `JWT_SECRET` using [jwtsecrets.com](https://jwtsecrets.com) or any secure random string.
- For `MONGO_URI`, see [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) for setup instructions.
- For `CLIENT_ID`, `CLIENT_SECRET`, and `REFRESH_TOKEN`, follow [Google OAuth2](https://github.com/ankurdotio/Difference-Backend-video/tree/main/025-googleoauth) setup guides.
- Use a temporary email for `USER_EMAIL` in development to protect your privacy.

## Running the Project

Make sure:

- MongoDB is running
- Redis is running
- Environment variables are configured correctly

Start the development server:

```bash
npm run dev
```

Server runs at:

```bash
http://localhost:3000
```

Swagger API Docs:

```bash
http://localhost:3000/api-docs
```

## System Design Concepts Implemented

- CQRS-lite balance snapshot architecture
- Distributed caching using Redis
- Distributed rate limiting
- Exactly-once transaction simulation
- Transactional outbox pattern
- Dead-letter event handling
- Immutable double-entry ledger system
- Deterministic account locking
- Async background job processing
- Retry orchestration with backoff

## Production-Level Features

- Distributed Redis caching
- Distributed Redis rate limiting
- Snapshot balance architecture
- Transaction-safe balance updates
- Immutable financial ledger
- Dead-letter queue handling
- Background async workers
- Structured request tracing
- Centralized logging
- Retry orchestration
- Request validation
- Swagger API documentation
- Cursor pagination
- Transaction idempotency

## API Endpoints

### Root Endpoint

- `GET /` — Returns a message confirming the service is running.

### Accounts

- `POST /api/accounts` — Create new account
- `GET /api/accounts` — Get all user accounts
- `GET /api/accounts/balance/:accountId` — Get account balance

### Transactions

- `POST /api/transactions` — Transfer between accounts
- `POST /api/transactions/system/initial-fund` — Initial funding from system account

### Authentication

- `POST /api/auth/register` — Register user
- `POST /api/auth/login` — Login user
- `POST /api/auth/logout` — Logout user

## API Documentation

Swagger documentation available at:

```bash
http://localhost:3000/api-docs
```

Production:

```bash
https://ledgerflow-backend-lufu.onrender.com/api-docs
```

## License

This project is licensed under the MIT License.
