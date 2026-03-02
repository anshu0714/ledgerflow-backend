const Transaction = require("../models/transaction.model");
const Account = require("../models/account.model");
const {
  processTransfer,
  processInitialFunding,
} = require("../services/transaction.service");
const emailService = require("../services/mail.service");
const User = require("../models/user.model");

async function createTransaction(req, res) {
  try {
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const transaction = await processTransfer({
      fromAccount,
      toAccount,
      amount,
      idempotencyKey,
    });

    try {
      await emailService.transactionSuccessEmail(
        req.user.name,
        req.user.email,
        amount,
        fromAccount,
        toAccount,
      );
    } catch (err) {
      console.error("Email failed:", err);
    }

    return res.status(201).json({
      message: "Transaction successful",
      transaction,
    });
  } catch (error) {
    if (error.code === 11000) {
      const existing = await Transaction.findOne({
        idempotencyKey: req.body.idempotencyKey,
      });

      return res.status(200).json({
        message: "Transaction already processed",
        transaction: existing,
      });
    }

    return res.status(500).json({
      message: error.message,
    });
  }
}

async function createInitialFundTransaction(req, res) {
  try {
    const { toAccount, amount, idempotencyKey } = req.body;

    if (!toAccount || !amount || !idempotencyKey) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const systemAccount = await Account.findOne({
      user: req.user._id,
    });

    if (!systemAccount) {
      return res.status(400).json({
        message: "System account not found",
      });
    }

    const transaction = await processInitialFunding({
      systemAccountId: systemAccount._id,
      toAccount,
      amount,
      idempotencyKey,
    });

    return res.status(201).json({
      message: "Initial funding successful",
      transaction,
    });
  } catch (error) {
    console.error("Error in transaction controller:", error);

    if (error.code === 11000) {
      const existing = await Transaction.findOne({
        idempotencyKey: req.body.idempotencyKey,
      });

      return res.status(200).json({
        message: "Transaction already processed",
        transaction: existing,
      });
    }

    return res.status(500).json({
      message: error.message,
    });
  }
}

module.exports = {
  createTransaction,
  createInitialFundTransaction,
};
