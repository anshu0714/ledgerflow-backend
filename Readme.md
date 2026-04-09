# LedgerFlow Backend

A **Node.js** backend application for managing accounts, transactions, and ledgers.

This project implements secure transactions with idempotency checks, ledger entries, and email notifications.

A production-grade backend system simulating fintech-level transaction reliability using idempotency, outbox pattern, and double-entry ledger design.

## Features

### Financial Transaction System

- Double-entry ledger system (DEBIT/CREDIT) ensuring accounting correctness
- MongoDB transactions for atomic debit/credit operations
- Immutable ledger entries to prevent tampering

### Idempotency & Exactly-Once Simulation

- Dedicated idempotency layer with request hashing
- Concurrency-safe handling using unique constraints
- Recovery mechanism for partially completed requests
- Prevents duplicate financial transactions under retries

### Outbox Pattern for Reliable Side Effects

- Transactional outbox ensures events are persisted with DB commits
- Background worker processes events asynchronously
- Retry mechanism with exponential backoff
- Guarantees email delivery even after failures or crashes

### Authentication & Security

- JWT-based authentication
- Token blacklisting for secure logout

### System Reliability

- Handles race conditions and partial failures
- Designed with production-grade backend patterns inspired by fintech systems

## Architecture Highlights

### Idempotency Flow

- Client Request → Idempotency Layer → Transaction Service → DB
- Ensures duplicate requests return same response
- Prevents double-spending scenarios

### Transaction + Ledger Flow

- Transaction → Ledger Entries (DEBIT/CREDIT) → Commit
- Atomic operation using MongoDB sessions
- Guarantees consistency of financial data

### Outbox Event Flow

- Transaction Commit → Outbox Event → Background Worker → Send Email
- Ensures reliable side effects
- Supports retries and failure recovery

### Failure Handling

- Crash after DB commit → event still processed via outbox
- Duplicate request → served from idempotency store
- Email failure → retried automatically

This architecture mimics real-world fintech systems like Stripe and Razorpay.

## Technologies Used

- **Node.js** & **Express.js**
- **MongoDB** & **Mongoose**
- **JWT Authentication**
- **Nodemailer** for email notifications

## Folder Structure

```
src/
├── config
│   └── db.js
├── controllers
│   ├── account.controller.js
│   ├── auth.controller.js
│   └── transaction.controller.js
├── middlewares
│   └── auth.middleware.js
│   └── logger.middleware.js
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
│   ├── outbox/
│   ├── idempotency.service.js
│   ├── mail.service.js
│   └── transaction.service.js
├── utils
│   ├── dbTransaction.utils.js
│   └── hash.utils.js
│   └── token.utils.js
└── workers
    ├── outbox.worker.js
    └── startOutbox.worker.js
app.js
package.json
server.js
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

## Environment Variables

To run this project, you need to create a `.env` file at the root of the project and provide the following environment variables:

```env
PORT="3000"
MONGO_URI=<your-mongodb-connection-string>
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

Start the server:

```bash
npm run dev
```

Server will run on: [http://localhost:3000](http://localhost:3000)

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
