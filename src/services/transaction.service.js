const Account = require("../models/account.model");
const Transaction = require("../models/transaction.model");
const Ledger = require("../models/ledger.model");
const Outbox = require("../models/outbox.model");
const logger = require("../utils/logger.utils");
const { randomUUID } = require("crypto");

async function processTransfer({
  fromAccount,
  toAccount,
  amount,
  userEmail,
  userName,
  session,
}) {
  try {
    const numericAmount = Number(amount);

    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error("Invalid transfer amount");
    }

    if (fromAccount.toString() === toAccount.toString()) {
      throw new Error("Cannot transfer to same account");
    }

    // Deterministic lock ordering
    const [firstId, secondId] = [fromAccount, toAccount].sort((a, b) =>
      a.toString().localeCompare(b.toString()),
    );

    const firstAccount = await Account.findOneAndUpdate(
      { _id: firstId },
      { $set: { updatedAt: new Date() } },
      { returnDocument: "after", session },
    );

    const secondAccount = await Account.findOneAndUpdate(
      { _id: secondId },
      { $set: { updatedAt: new Date() } },
      { returnDocument: "after", session },
    );

    const fromUser =
      firstId.toString() === fromAccount.toString()
        ? firstAccount
        : secondAccount;

    const toUser =
      firstId.toString() === toAccount.toString()
        ? firstAccount
        : secondAccount;

    if (!fromUser || !toUser) {
      logger.error("Transfer failed - account not found", {
        fromAccount,
        toAccount,
      });

      throw new Error("Account not found");
    }

    if (fromUser.status !== "ACTIVE" || toUser.status !== "ACTIVE") {
      logger.error("Transfer failed - account not active", {
        fromAccount,
        toAccount,
      });

      throw new Error("Account not active");
    }

    // Balance validation
    if (fromUser.balance < numericAmount) {
      logger.error("Transfer failed - insufficient funds", {
        fromAccount,
        balance: fromUser.balance,
        attemptedAmount: numericAmount,
      });

      throw new Error("Insufficient funds");
    }

    // Create transaction
    const [transaction] = await Transaction.create(
      [
        {
          fromAccount,
          toAccount,
          amount: numericAmount,
          status: "PENDING",
          referenceId: randomUUID(),
        },
      ],
      { session },
    );

    logger.info("Transaction created", {
      referenceId: transaction.referenceId,
      transactionId: transaction._id,
    });

    // Safe balance derivation
    const updatedBalance = Number(fromUser.balance) - numericAmount;

    if (updatedBalance < 0) {
      throw new Error("Insufficient funds");
    }

    fromUser.balance = updatedBalance;
    toUser.balance += numericAmount;

    // Optimistic concurrency protection
    try {
      await fromUser.save({ session });
      await toUser.save({ session });
    } catch (err) {
      if (err.name === "VersionError") {
        throw new Error("Concurrent balance update detected");
      }

      throw err;
    }

    // Immutable ledger entries
    await Ledger.insertMany(
      [
        {
          transaction: transaction._id,
          account: fromAccount,
          amount: numericAmount,
          transactionType: "DEBIT",
        },
        {
          transaction: transaction._id,
          account: toAccount,
          amount: numericAmount,
          transactionType: "CREDIT",
        },
      ],
      { session },
    );

    // Outbox event
    await Outbox.create(
      [
        {
          eventName: "TRANSACTION_SUCCESS",
          payload: {
            referenceId: transaction.referenceId,
            userName,
            userEmail,
            fromAccount,
            toAccount,
            amount: numericAmount,
          },
          status: "PENDING",
        },
      ],
      { session },
    );

    transaction.status = "COMPLETED";

    await transaction.save({ session });

    return transaction;
  } catch (err) {
    logger.error("processTransfer failed", {
      fromAccount,
      toAccount,
      amount,
      referenceId: err?.referenceId,
      error: err.message,
      stack: err.stack,
    });

    throw err;
  }
}

async function processInitialFunding({
  systemAccountId,
  toAccount,
  amount,
  session,
}) {
  try {
    const numericAmount = Number(amount);

    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error("Invalid funding amount");
    }

    const systemAccount =
      await Account.findById(systemAccountId).session(session);

    const receiver = await Account.findById(toAccount).session(session);

    if (!systemAccount || !receiver) {
      logger.error("Initial funding failed - account not found", {
        systemAccountId,
        toAccount,
      });

      throw new Error("Account not found");
    }

    if (receiver.status !== "ACTIVE") {
      logger.error("Initial funding failed - receiver inactive", {
        toAccount,
      });

      throw new Error("Receiver account not active");
    }

    if (systemAccount.balance < numericAmount) {
      logger.error("Initial funding failed - insufficient system funds", {
        systemAccountId,
        balance: systemAccount.balance,
        attemptedAmount: numericAmount,
      });

      throw new Error("Insufficient system funds");
    }

    const [transaction] = await Transaction.create(
      [
        {
          fromAccount: systemAccount._id,
          toAccount,
          amount: numericAmount,
          status: "PENDING",
          referenceId: randomUUID(),
        },
      ],
      { session },
    );

    logger.info("Initial funding transaction created", {
      referenceId: transaction.referenceId,
      transactionId: transaction._id,
    });

    const updatedSystemBalance = Number(systemAccount.balance) - numericAmount;

    if (updatedSystemBalance < 0) {
      throw new Error("Insufficient system funds");
    }

    systemAccount.balance = updatedSystemBalance;
    receiver.balance += numericAmount;

    try {
      await systemAccount.save({ session });
      await receiver.save({ session });
    } catch (err) {
      if (err.name === "VersionError") {
        throw new Error("Concurrent balance update detected");
      }

      throw err;
    }

    await Ledger.insertMany(
      [
        {
          transaction: transaction._id,
          account: systemAccount._id,
          amount: numericAmount,
          transactionType: "DEBIT",
        },
        {
          transaction: transaction._id,
          account: receiver._id,
          amount: numericAmount,
          transactionType: "CREDIT",
        },
      ],
      { session },
    );

    transaction.status = "COMPLETED";

    await transaction.save({ session });

    return transaction;
  } catch (err) {
    logger.error("processInitialFunding failed", {
      systemAccountId,
      toAccount,
      amount,
      error: err.message,
      stack: err.stack,
    });

    throw err;
  }
}

module.exports = {
  processTransfer,
  processInitialFunding,
};
