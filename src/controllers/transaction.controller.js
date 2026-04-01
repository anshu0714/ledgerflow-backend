const Account = require("../models/account.model");
const {
  processTransfer,
  processInitialFunding,
} = require("../services/transaction.service");
const emailService = require("../services/mail.service");
const handleIdempotentRequest = require("../services/idempotency.service");

async function createTransaction(req, res) {
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const result = await handleIdempotentRequest({
    idempotencyKey,
    payload: { fromAccount, toAccount, amount },
    handler: async () => {
      return await processTransfer({ fromAccount, toAccount, amount });
    },
  });

  if (result.type === "ERROR") {
    return res.status(result.status).json({ message: result.message });
  }

  if (!result.isReplay) {
    emailService
      .transactionSuccessEmail(
        req.user.name,
        req.user.email,
        amount,
        fromAccount,
        toAccount,
      )
      .catch(() => {});
  }

  return res.status(201).json({
    message: "Transaction successful",
    transaction: result.data,
  });
}

async function createInitialFundTransaction(req, res) {
  const { toAccount, amount, idempotencyKey } = req.body;

  if (!toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const systemAccount = await Account.findOne({
    user: req.user._id,
  });

  if (!systemAccount) {
    return res.status(400).json({
      message: "System account not found",
    });
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

  return res.status(201).json({
    message: "Initial funding successful",
    transaction: result.data,
  });
}

module.exports = {
  createTransaction,
  createInitialFundTransaction,
};
