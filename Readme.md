# LedgerFlow Backend

A **Node.js** backend application for managing accounts, transactions, and ledgers.  
This project implements secure transactions with idempotency checks, ledger entries, and email notifications.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Folder Structure](#folder-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [API Endpoints](#api-endpoints)
- [License](#license)

## Features

- Account management: create accounts, fetch balance, list user accounts
- Transactions with idempotency and ledger entries
- Initial funding support for system accounts
- JWT-based authentication with token blacklist for logout security
- Email notifications for transaction success/failure
- MongoDB transactions for safe debit/credit operations

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
├── models
│   ├── account.model.js
│   ├── ledger.model.js
│   ├── tokenBlacklist.model.js
│   ├── transaction.model.js
│   └── user.model.js
├── routes
│   ├── account.routes.js
│   ├── auth.routes.js
│   └── transaction.routes.js
├── services
│   ├── idempotency.service.js
│   ├── mail.service.js
│   └── transaction.service.js
└── utils
    ├── dbTransaction.utils.js
    └── token.utils.js

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
