const Account = require("../models/account.model");
const cache = require("../utils/cache");
const { success, error } = require("../utils/apiResponse.utils");
const { isRateLimited } = require("../utils/rateLimiter.utils");
const logger = require("../utils/logger");

async function createAccount(req, res) {
  try {
    const account = await Account.create({
      user: req.user._id,
      currency: req.body.currency,
    });

    return success(res, { account }, "Account created successfully!", 201);
  } catch (err) {
    logger.error("Create account failed", {
      requestId: req.requestId,
      userId: req.user?._id,
      error: err.message,
      stack: err.stack,
    });

    return error(res, "Failed to create account");
  }
}

async function getUserAccounts(req, res) {
  try {
    const accounts = await Account.find({ user: req.user._id });

    return success(res, { accounts }, "Accounts fetched successfully");
  } catch (err) {
    logger.error("Fetch user accounts failed", {
      requestId: req.requestId,
      userId: req.user?._id,
      error: err.message,
      stack: err.stack,
    });

    return error(res, "Failed to fetch accounts");
  }
}

async function getAccountBalance(req, res) {
  try {
    const { accountId } = req.params;
    const userId = req.user._id;

    const cacheKey = `balance:${userId}:${accountId}`;
    const rateKey = `balance:${userId}`;

    // Rate limit
    if (isRateLimited(rateKey, 30, 60 * 1000)) {
      logger.warn("Rate limit exceeded for balance", {
        requestId: req.requestId,
        userId,
        accountId,
      });

      return error(res, "Too many balance requests", 429);
    }

    // Cache check
    const cached = cache.get(cacheKey);
    if (cached !== undefined) {
      return success(
        res,
        { accountId, balance: cached, cached: true },
        "Balance fetched from cache",
      );
    }

    const account = await Account.findOne({
      _id: accountId,
      user: userId,
    });

    if (!account) {
      logger.error("Account not found", {
        requestId: req.requestId,
        userId,
        accountId,
      });

      return error(res, "Account not found", 404);
    }

    const balance = await account.getBalance();

    cache.set(cacheKey, balance);

    return success(
      res,
      { accountId: account._id, balance },
      "Balance fetched successfully",
    );
  } catch (err) {
    logger.error("Get account balance failed", {
      requestId: req.requestId,
      userId: req.user?._id,
      accountId: req.params?.accountId,
      error: err.message,
      stack: err.stack,
    });

    if (err.name === "CastError") {
      return error(res, "Invalid account ID", 400);
    }

    return error(res, "Failed to fetch balance");
  }
}

module.exports = {
  createAccount,
  getUserAccounts,
  getAccountBalance,
};
