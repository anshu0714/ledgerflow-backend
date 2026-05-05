const Account = require("../models/account.model");
const cache = require("../utils/cache");
const {
  processTransfer,
  processInitialFunding,
} = require("../services/transaction.service");
const handleIdempotentRequest = require("../services/idempotency.service");
const Transaction = require("../models/transaction.model");
const { isRateLimited } = require("../utils/rateLimiter.utils");
const { success, error } = require("../utils/apiResponse.utils");
const logger = require("../utils/logger");

async function createTransaction(req, res) {
  try {
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

    const userEmail = req.user.email;
    const userName = req.user.name;
    const userId = req.user._id;

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
      return error(res, "Missing required fields", 400);
    }

    const key = `txn:${userId}:${fromAccount}`;

    if (isRateLimited(key, 10, 60 * 1000)) {
      logger.warn("Transaction rate limit exceeded", {
        requestId: req.requestId,
        userId,
        fromAccount,
      });

      return error(res, "Too many transactions. Please slow down.", 429);
    }

    const account = await Account.findById(fromAccount);

    if (!account) {
      logger.error("Transaction failed - from account not found", {
        requestId: req.requestId,
        userId,
        fromAccount,
      });

      return error(res, "From account not found", 404);
    }

    if (account.user.toString() !== userId.toString()) {
      logger.error("Transaction failed - unauthorized ownership", {
        requestId: req.requestId,
        userId,
        fromAccount,
      });

      return error(res, "Unauthorized: You do not own this account", 403);
    }

    const receiver = await Account.findById(toAccount);

    if (!receiver) {
      logger.error("Transaction failed - receiver not found", {
        requestId: req.requestId,
        toAccount,
      });

      return error(res, "Receiver account not found", 404);
    }

    if (receiver.status !== "ACTIVE") {
      logger.error("Transaction failed - receiver inactive", {
        requestId: req.requestId,
        toAccount,
      });

      return error(res, "Receiver account not active", 400);
    }

    const result = await handleIdempotentRequest({
      idempotencyKey,
      payload: { fromAccount, toAccount, amount },
      handler: async (session) => {
        return await processTransfer({
          fromAccount,
          toAccount,
          amount,
          userEmail,
          userName,
          session,
        });
      },
    });

    if (result.type === "ERROR") {
      logger.error("Transaction idempotency error", {
        requestId: req.requestId,
        userId,
        message: result.message,
      });

      return error(res, result.message, result.status);
    }

    if (!result.isReplay) {
      cache.del(`balance:${userId}:${fromAccount}`);
      cache.del(`balance:${userId}:${toAccount}`);
    }

    const statusCode = result.isReplay ? 200 : 201;

    return success(
      res,
      { transaction: result.data },
      "Transaction successful",
      statusCode,
    );
  } catch (err) {
    logger.error("Transaction processing failed", {
      requestId: req.requestId,
      userId: req.user?._id,
      error: err.message,
      stack: err.stack,
    });

    return error(res, "Transaction failed");
  }
}

// INITIAL FUND
async function createInitialFundTransaction(req, res) {
  try {
    const { toAccount, amount, idempotencyKey } = req.body;
    const userId = req.user._id;

    if (!toAccount || !amount || !idempotencyKey) {
      return error(res, "Missing required fields", 400);
    }

    const key = `fund:${userId}`;

    if (isRateLimited(key, 5, 60 * 1000)) {
      logger.warn("Initial funding rate limit exceeded", {
        requestId: req.requestId,
        userId,
      });

      return error(res, "Too many funding requests", 429);
    }

    const systemAccount = await Account.findOne({
      user: userId,
      isSystemAccount: true,
    });

    if (!systemAccount) {
      logger.error("Initial funding failed - system account missing", {
        requestId: req.requestId,
        userId,
      });

      return error(res, "System account not found", 400);
    }

    const receiver = await Account.findById(toAccount);

    if (!receiver) {
      logger.error("Initial funding failed - receiver not found", {
        requestId: req.requestId,
        toAccount,
      });

      return error(res, "Receiver account not found", 404);
    }

    if (receiver.status !== "ACTIVE") {
      logger.error("Initial funding failed - receiver inactive", {
        requestId: req.requestId,
        toAccount,
      });

      return error(res, "Receiver account not active", 400);
    }

    const result = await handleIdempotentRequest({
      idempotencyKey,
      payload: {
        fromAccount: systemAccount._id,
        toAccount,
        amount,
      },
      handler: async (session) => {
        return await processInitialFunding({
          systemAccountId: systemAccount._id,
          toAccount,
          amount,
          session,
        });
      },
    });

    if (result.type === "ERROR") {
      logger.error("Initial funding idempotency error", {
        requestId: req.requestId,
        userId,
        message: result.message,
      });

      return error(res, result.message, result.status);
    }

    if (!result.isReplay) {
      cache.del(`balance:${userId}:${toAccount}`);
      cache.del(`balance:${userId}:${systemAccount._id}`);
    }

    const statusCode = result.isReplay ? 200 : 201;

    return success(
      res,
      { transaction: result.data },
      "Initial funding successful",
      statusCode,
    );
  } catch (err) {
    logger.error("Initial funding failed", {
      requestId: req.requestId,
      userId: req.user?._id,
      error: err.message,
      stack: err.stack,
    });

    return error(res, "Initial funding failed");
  }
}

// TRANSACTION HISTORY
async function getTransactionHistory(req, res) {
  try {
    const { accountId, cursor, limit } = req.query;

    const key = `history:${req.user._id}`;

    if (isRateLimited(key, 20, 60 * 1000)) {
      logger.warn("History rate limit exceeded", {
        requestId: req.requestId,
        userId: req.user._id,
      });

      return error(res, "Too many requests. Slow down.", 429);
    }

    const account = await Account.findOne({
      _id: accountId,
      user: req.user._id,
    });

    if (!account) {
      logger.error("History access unauthorized", {
        requestId: req.requestId,
        userId: req.user._id,
        accountId,
      });

      return error(res, "Unauthorized access", 403);
    }

    const query = {
      $or: [{ fromAccount: accountId }, { toAccount: accountId }],
    };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const nextCursor =
      transactions.length > 0
        ? transactions[transactions.length - 1].createdAt
        : null;

    return success(res, { transactions, nextCursor });
  } catch (err) {
    logger.error("Fetch transaction history failed", {
      requestId: req.requestId,
      userId: req.user?._id,
      error: err.message,
      stack: err.stack,
    });

    return error(res, "Failed to fetch transaction history");
  }
}

module.exports = {
  createTransaction,
  createInitialFundTransaction,
  getTransactionHistory,
};
