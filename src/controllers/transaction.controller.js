const Account = require("../models/account.model");
const cache = require("../utils/cache");
const {
  processTransfer,
  processInitialFunding,
} = require("../services/transaction.service");
const handleIdempotentRequest = require("../services/idempotency.service");
const Transaction = require("../models/transaction.model");
const { isRateLimited } = require("../utils/rateLimiter.utils");

async function createTransaction(req, res) {
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

  const userEmail = req.user.email;
  const userName = req.user.name;
  const userId = req.user._id;

  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const key = `txn:${req.user._id}:${fromAccount}`;

  if (isRateLimited(key, 10, 60 * 1000)) {
    return res.status(429).json({
      message: "Too many transactions. Please slow down.",
    });
  }

  const account = await Account.findById(fromAccount);

  if (!account) {
    return res.status(404).json({ message: "From account not found" });
  }

  if (account.user.toString() !== userId.toString()) {
    return res.status(403).json({
      message: "Unauthorized: You do not own this account",
    });
  }

  const receiver = await Account.findById(toAccount);

  if (!receiver) {
    return res.status(404).json({ message: "Receiver account not found" });
  }

  if (receiver.status !== "ACTIVE") {
    return res.status(400).json({ message: "Receiver account not active" });
  }

  const result = await handleIdempotentRequest({
    idempotencyKey,
    payload: { fromAccount, toAccount, amount },
    handler: async () => {
      return await processTransfer({
        fromAccount,
        toAccount,
        amount,
        userEmail,
        userName,
      });
    },
  });

  if (result.type === "ERROR") {
    return res.status(result.status).json({ message: result.message });
  }

  if (!result.isReplay) {
    cache.del(`balance:${userId}:${fromAccount}`);
    cache.del(`balance:${userId}:${toAccount}`);
  }

  const statusCode = result.isReplay ? 200 : 201;

  return res.status(statusCode).json({
    message: "Transaction successful",
    transaction: result.data,
  });
}

async function createInitialFundTransaction(req, res) {
  const { toAccount, amount, idempotencyKey } = req.body;
  const userId = req.user._id;

  if (!toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const key = `fund:${req.user._id}`;

  if (isRateLimited(key, 5, 60 * 1000)) {
    return res.status(429).json({
      message: "Too many funding requests",
    });
  }

  const systemAccount = await Account.findOne({
    user: userId,
    isSystemAccount: true,
  });

  if (!systemAccount) {
    return res.status(400).json({
      message: "System account not found",
    });
  }

  const receiver = await Account.findById(toAccount);

  if (!receiver) {
    return res.status(404).json({ message: "Receiver account not found" });
  }

  if (receiver.status !== "ACTIVE") {
    return res.status(400).json({ message: "Receiver account not active" });
  }

  const result = await handleIdempotentRequest({
    idempotencyKey,
    payload: {
      fromAccount: systemAccount._id,
      toAccount,
      amount,
    },
    handler: async () => {
      return await processInitialFunding({
        systemAccountId: systemAccount._id,
        toAccount,
        amount,
      });
    },
  });

  if (result.type === "ERROR") {
    return res.status(result.status).json({ message: result.message });
  }

  if (!result.isReplay) {
    cache.del(`balance:${userId}:${toAccount}`);
    cache.del(`balance:${userId}:${systemAccount._id}`);
  }

  const statusCode = result.isReplay ? 200 : 201;

  return res.status(statusCode).json({
    message: "Initial funding successful",
    transaction: result.data,
  });
}

async function getTransactionHistory(req, res) {
  try {
    const { accountId, cursor, limit = 10 } = req.query;

    if (!accountId) {
      return res.status(400).json({ message: "accountId is required" });
    }

    const key = `history:${req.user._id}`;

    if (isRateLimited(key, 20, 60 * 1000)) {
      return res.status(429).json({
        message: "Too many requests. Slow down.",
      });
    }

    const account = await Account.findOne({
      _id: accountId,
      user: req.user._id,
    });

    if (!account) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const query = {
      $or: [{ fromAccount: accountId }, { toAccount: accountId }],
    };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const parsedLimit = parseInt(limit, 10);
    const safeLimit = Math.min(Math.max(parsedLimit || 10, 1), 50);

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(safeLimit);

    const nextCursor =
      transactions.length > 0
        ? transactions[transactions.length - 1].createdAt
        : null;

    return res.status(200).json({
      data: transactions,
      nextCursor,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  createTransaction,
  createInitialFundTransaction,
  getTransactionHistory,
};
