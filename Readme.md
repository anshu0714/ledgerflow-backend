# LedgerFlow Backend

JWT Authentication • Redis Caching • BullMQ Workers • Transactional Outbox • Idempotency • Double Entry Ledger • MongoDB Transactions

Production-oriented fintech backend simulation built with Node.js, MongoDB, Redis, and BullMQ.

Implements Redis-backed caching, idempotency protection, transactional outbox pattern, immutable double-entry ledger architecture, async event processing, and recovery-safe financial transaction workflows.

Production deployed on Render with Redis + MongoDB Atlas integration. Initial cold start may take 30–50 seconds.

## Links

- API Docs: https://ledgerflow-backend-lufu.onrender.com/api-docs
- Backend: https://ledgerflow-backend-lufu.onrender.com/
- GitHub Repository: https://github.com/anshu0714/ledgerflow-backend

---

## Core Features

### Financial System

- Immutable double-entry ledger system
- Atomic MongoDB transactions
- Snapshot-based O(1) balance reads
- Cursor-paginated transaction history
- Deterministic account locking for concurrency safety

### Reliability & Consistency

- Idempotency layer with request hashing
- Exactly-once transaction simulation
- Transactional outbox pattern
- BullMQ async event processing
- Recovery worker for missing queue jobs
- Dead-letter handling with retry backoff
- Redis graceful degradation support
- Recovery-safe queue restoration after crashes/restarts

### Scalability

- Redis distributed caching
- Redis distributed rate limiting
- Automatic cache invalidation
- Shared Redis-backed infrastructure

### Security & Observability

- JWT authentication
- Token blacklisting
- Zod request validation
- Structured JSON logging
- Request tracing with request IDs
- API monitoring & health logging

---

## Architecture Flows

### Transaction Flow

```text
Client Request
    ↓
Idempotency Layer
    ↓
MongoDB Transaction
    ↓
Balance Snapshot Update
    ↓
Immutable Ledger Entry
    ↓
Outbox Event
    ↓
BullMQ Worker
    ↓
Email/Event Processing
```

### Failure Recovery

- Duplicate requests safely replay responses
- Queue recovery restores missing jobs
- Failed jobs retried with exponential backoff
- Permanent failures moved to dead-letter state
- Redis outages handled gracefully

---

## Tech Stack

- Node.js & Express.js
- MongoDB & Mongoose
- Redis
- BullMQ
- JWT Authentication
- Zod Validation
- Nodemailer
- Swagger/OpenAPI
- Docker

---

## Project Structure

```bash
src/
├── config/
├── controllers/
├── middlewares/
├── models/
├── queues/
├── routes/
├── services/
├── utils/
├── validators/
└── workers/
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

Production Docs:

```bash
https://ledgerflow-backend-lufu.onrender.com/api-docs
```

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

## License

This project is licensed under the MIT License.
