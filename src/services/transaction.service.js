const Account = require("../models/account.model");
const Transaction = require("../models/transaction.model");
const Ledger = require("../models/ledger.model");
const Outbox = require("../models/outbox.model");
const logger = require("../utils/logger.utils");

async function processTransfer({
  fromAccount,
  toAccount,
  amount,
  userEmail,
  userName,
  session,
}) {
  try {
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

    // Derive balance

    if (fromUser.balance < amount) {
      logger.error("Transfer failed - insufficient funds", {
        fromAccount,
        balance: fromUser.balance,
        attemptedAmount: amount,
      });
      throw new Error("Insufficient funds");
    }

    // Create transaction
    const [transaction] = await Transaction.create(
      [
        {
          fromAccount,
          toAccount,
          amount,
          status: "PENDING",
        },
      ],
      { session },
    );

    // Balance update
    fromUser.balance -= amount;
    toUser.balance += amount;

    await fromUser.save({ session });
    await toUser.save({ session });

    // Ledger entries
    await Ledger.insertMany(
      [
        {
          transaction: transaction._id,
          account: fromAccount,
          amount,
          transactionType: "DEBIT",
        },
        {
          transaction: transaction._id,
          account: toAccount,
          amount,
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
            userName,
            userEmail,
            fromAccount,
            toAccount,
            amount,
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

    if (systemAccount.balance < amount) {
      logger.error("Initial funding failed - insufficient system funds", {
        systemAccountId,
        balance: systemAccount.balance,
        attemptedAmount: amount,
      });

      throw new Error("Insufficient system funds");
    }

    const [transaction] = await Transaction.create(
      [
        {
          fromAccount: systemAccount._id,
          toAccount,
          amount,
          status: "PENDING",
        },
      ],
      { session },
    );

    receiver.balance += amount;
    systemAccount.balance -= amount;

    await systemAccount.save({ session });
    await receiver.save({ session });

    await Ledger.insertMany(
      [
        {
          transaction: transaction._id,
          account: systemAccount._id,
          amount,
          transactionType: "DEBIT",
        },
        {
          transaction: transaction._id,
          account: receiver._id,
          amount,
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
